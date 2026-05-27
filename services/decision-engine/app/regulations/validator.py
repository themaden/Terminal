"""Decision validator – checks decisions against regulatory rules."""

from __future__ import annotations

from dataclasses import dataclass, field

from app.models.decision import Decision, DecisionAction
from app.regulations.eu261 import EU261Calculator
from app.utils.logger import get_logger

logger = get_logger(__name__)


@dataclass
class ValidationIssue:
    """A single compliance issue found during validation."""

    field: str
    message: str
    severity: str = "WARNING"  # WARNING | ERROR


@dataclass
class ValidationResult:
    """Outcome of validating a set of decisions."""

    is_valid: bool = True
    issues: list[ValidationIssue] = field(default_factory=list)

    def add_warning(self, field_name: str, message: str) -> None:
        self.issues.append(ValidationIssue(field=field_name, message=message, severity="WARNING"))

    def add_error(self, field_name: str, message: str) -> None:
        self.issues.append(ValidationIssue(field=field_name, message=message, severity="ERROR"))
        self.is_valid = False


class DecisionValidator:
    """Validates proposed decisions against EU 261/2004 and internal rules."""

    # Maximum amounts allowed per action type (safety caps)
    MAX_COMPENSATION_EUR = 600.0
    MAX_HOTEL_COST_EUR = 200.0
    MAX_MEAL_VOUCHER_EUR = 50.0

    def __init__(self) -> None:
        self._calculator = EU261Calculator()

    def validate_decision(
        self,
        decision: Decision,
        distance_km: float = 0.0,
        delay_hours: float = 0.0,
    ) -> ValidationResult:
        """Run all validation checks on a single decision.

        Parameters
        ----------
        decision : Decision
            The proposed decision to validate.
        distance_km : float
            Flight distance (used for compensation cap checks).
        delay_hours : float
            Delay in hours at destination.

        Returns
        -------
        ValidationResult with is_valid flag and list of issues.
        """
        result = ValidationResult()

        self._check_compensation_cap(decision, result)
        self._check_compensation_eu261(decision, distance_km, delay_hours, result)
        self._check_hotel_amount(decision, result)
        self._check_meal_amount(decision, result)
        self._check_rebook_has_flight(decision, result)
        self._check_confidence_threshold(decision, result)

        if result.is_valid:
            logger.debug("Decision %s passed validation.", decision.id)
        else:
            logger.warning(
                "Decision %s failed validation with %d issue(s).",
                decision.id,
                len(result.issues),
            )

        return result

    def validate_batch(
        self,
        decisions: list[Decision],
        distance_km: float = 0.0,
        delay_hours: float = 0.0,
    ) -> dict[str, ValidationResult]:
        """Validate multiple decisions and return results keyed by decision ID."""
        return {
            str(d.id): self.validate_decision(d, distance_km, delay_hours)
            for d in decisions
        }

    # ── Individual checks ─────────────────────────────────────────────

    @classmethod
    def _check_compensation_cap(cls, decision: Decision, result: ValidationResult) -> None:
        if decision.compensation_amount_eur > cls.MAX_COMPENSATION_EUR:
            result.add_error(
                "compensation_amount_eur",
                f"Compensation €{decision.compensation_amount_eur:.2f} exceeds "
                f"EU 261 maximum of €{cls.MAX_COMPENSATION_EUR:.2f}.",
            )

    def _check_compensation_eu261(
        self,
        decision: Decision,
        distance_km: float,
        delay_hours: float,
        result: ValidationResult,
    ) -> None:
        if decision.action != DecisionAction.COMPENSATE:
            return
        if distance_km <= 0:
            return  # can't validate without distance

        expected = self._calculator.calculate_compensation(
            distance_km=distance_km,
            delay_hours=delay_hours,
            passenger_id=decision.passenger_id,
        )
        if decision.compensation_amount_eur != expected.amount_eur:
            result.add_warning(
                "compensation_amount_eur",
                f"Proposed €{decision.compensation_amount_eur:.2f} differs from "
                f"EU 261 calculated amount €{expected.amount_eur:.2f}.",
            )

    @classmethod
    def _check_hotel_amount(cls, decision: Decision, result: ValidationResult) -> None:
        if decision.action == DecisionAction.HOTEL and decision.hotel_name is None:
            result.add_error("hotel_name", "HOTEL action requires a hotel_name.")

    @classmethod
    def _check_meal_amount(cls, decision: Decision, result: ValidationResult) -> None:
        if decision.meal_voucher_eur > cls.MAX_MEAL_VOUCHER_EUR:
            result.add_warning(
                "meal_voucher_eur",
                f"Meal voucher €{decision.meal_voucher_eur:.2f} exceeds "
                f"recommended cap of €{cls.MAX_MEAL_VOUCHER_EUR:.2f}.",
            )

    @staticmethod
    def _check_rebook_has_flight(decision: Decision, result: ValidationResult) -> None:
        if decision.action == DecisionAction.REBOOK and decision.new_flight_id is None:
            result.add_error(
                "new_flight_id",
                "REBOOK action must specify a new_flight_id.",
            )

    @staticmethod
    def _check_confidence_threshold(
        decision: Decision,
        result: ValidationResult,
        threshold: float = 0.3,
    ) -> None:
        if decision.agent_confidence < threshold:
            result.add_warning(
                "agent_confidence",
                f"Agent confidence {decision.agent_confidence:.2f} is below "
                f"the {threshold:.2f} threshold – manual review recommended.",
            )
