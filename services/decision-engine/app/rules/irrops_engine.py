"""IRROPS (Irregular Operations) Rule Engine.

Combines MCT/ACT checks, EU261/AB261 compliance, and local LLM recommendations
to produce structured recovery recommendations for each disrupted passenger.
The optimizer (MILP) then assigns the actual seat — this engine produces the
priority-ordered candidate list and the compliance obligations.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional

from app.regulations.eu261 import EU261Calculator
from app.rules.mct import MCTCalculator, ConnectionType
from app.rules.act import ACTTracker, ConnectionRecord, ConnectionStatus


class RecoveryAction(str, Enum):
    REBOOK_SAME_CARRIER = "REBOOK_SAME_CARRIER"
    REBOOK_INTERLINE = "REBOOK_INTERLINE"
    HOTEL_OVERNIGHT = "HOTEL_OVERNIGHT"
    DOWNGRADE_REBOOK = "DOWNGRADE_REBOOK"
    VOLUNTARY_DENIED = "VOLUNTARY_DENIED"
    REFUND = "REFUND"
    HOLD_FOR_LATE_CONNECT = "HOLD_FOR_LATE_CONNECT"


class DisruptionType(str, Enum):
    CANCELLATION = "CANCELLATION"
    DELAY = "DELAY"
    DIVERSION = "DIVERSION"
    GATE_CHANGE = "GATE_CHANGE"
    MISSED_CONNECTION = "MISSED_CONNECTION"


@dataclass
class PassengerContext:
    passenger_id: int
    pnr: str
    ticket_class: str          # ECONOMY, BUSINESS, FIRST
    loyalty_tier: str          # NONE, SILVER, GOLD, PLATINUM
    has_wheelchair: bool = False
    is_unaccompanied_minor: bool = False
    has_medical: bool = False
    inbound_flight: Optional[str] = None    # set if connecting passenger
    outbound_flight: Optional[str] = None


@dataclass
class FlightContext:
    flight_number: str
    origin: str
    destination: str
    distance_km: float
    disruption_type: DisruptionType
    delay_minutes: int
    scheduled_departure: datetime
    estimated_departure: Optional[datetime] = None
    is_eu_departure: bool = True


@dataclass
class RecoveryRecommendation:
    passenger_id: int
    pnr: str
    recommended_action: RecoveryAction
    priority_score: float           # 0.0–1.0, higher = process first
    eu261_compensation_eur: float
    duty_of_care_meal: bool
    duty_of_care_hotel: bool
    duty_of_care_transport: bool
    mct_check_passed: Optional[bool]
    connection_status: Optional[str]
    reasoning: str
    compliance_flags: list[str] = field(default_factory=list)


# Priority multipliers for passenger categories
_LOYALTY_PRIORITY = {"PLATINUM": 1.0, "GOLD": 0.85, "SILVER": 0.7, "NONE": 0.5}
_CLASS_PRIORITY = {"FIRST": 1.0, "BUSINESS": 0.9, "ECONOMY": 0.6}


class IRROPSEngine:
    """
    Central IRROPS decision engine.

    Workflow:
    1. Classify the disruption type.
    2. Run MCT/ACT check for connecting passengers.
    3. Calculate EU261 obligations.
    4. Assign duty-of-care entitlements (AB261/IATA Res 735e).
    5. Produce prioritized RecoveryRecommendation list for each passenger.
    The MILP solver then takes these recommendations and assigns actual seats.
    """

    def __init__(self) -> None:
        self._eu261 = EU261Calculator()
        self._act_tracker = ACTTracker()

    @property
    def act_tracker(self) -> ACTTracker:
        return self._act_tracker

    def evaluate(
        self,
        flight: FlightContext,
        passengers: list[PassengerContext],
    ) -> list[RecoveryRecommendation]:
        recommendations: list[RecoveryRecommendation] = []

        for pax in passengers:
            rec = self._evaluate_passenger(flight, pax)
            recommendations.append(rec)

        # Sort by priority descending so the MILP optimizer processes VIPs first
        recommendations.sort(key=lambda r: r.priority_score, reverse=True)
        return recommendations

    def _evaluate_passenger(
        self,
        flight: FlightContext,
        pax: PassengerContext,
    ) -> RecoveryRecommendation:
        priority = self._calculate_priority(pax)
        compliance_flags: list[str] = []

        # EU 261 / AB 261 compensation
        eu_result = self._eu261.calculate(
            distance_km=flight.distance_km,
            delay_minutes=float(flight.delay_minutes),
        )
        compensation_eur = eu_result["compensation_eur"] if flight.is_eu_departure else 0.0

        # Duty of care (IATA Resolution 735e / EU261 Art.9)
        duty_meal, duty_hotel, duty_transport = self._duty_of_care(flight)

        # MCT/ACT check for connecting passengers
        mct_passed: Optional[bool] = None
        conn_status: Optional[str] = None

        if pax.inbound_flight and pax.outbound_flight:
            # Estimate available connection minutes from delay info
            available_minutes = max(0, -flight.delay_minutes + 90)  # baseline estimate
            outbound_dep_minutes = available_minutes

            mct_result = MCTCalculator.check_connection(
                airport_icao=flight.origin,
                inbound_arrival_minutes=flight.delay_minutes,
                outbound_departure_minutes=outbound_dep_minutes,
                passenger_needs_wheelchair=pax.has_wheelchair,
            )
            mct_passed = mct_result.is_connection_feasible
            conn_status = "OK" if mct_passed else "MISSED"

            if not mct_passed:
                compliance_flags.append("MCT_VIOLATION")
                flight = FlightContext(
                    **{**flight.__dict__, "disruption_type": DisruptionType.MISSED_CONNECTION}
                )

        # Select recovery action
        action = self._select_action(flight, pax, mct_passed)

        # Compliance flags
        if compensation_eur > 0:
            compliance_flags.append(f"EU261_EUR{int(compensation_eur)}")
        if pax.is_unaccompanied_minor:
            compliance_flags.append("UMNR_SUPERVISION_REQUIRED")
        if pax.has_medical:
            compliance_flags.append("MEDICAL_PRIORITY")
        if flight.disruption_type == DisruptionType.DIVERSION:
            compliance_flags.append("DIVERSION_RETURN_TRANSPORT")

        reasoning = self._build_reasoning(flight, pax, action, compensation_eur, mct_passed)

        return RecoveryRecommendation(
            passenger_id=pax.passenger_id,
            pnr=pax.pnr,
            recommended_action=action,
            priority_score=priority,
            eu261_compensation_eur=compensation_eur,
            duty_of_care_meal=duty_meal,
            duty_of_care_hotel=duty_hotel,
            duty_of_care_transport=duty_transport,
            mct_check_passed=mct_passed,
            connection_status=conn_status,
            reasoning=reasoning,
            compliance_flags=compliance_flags,
        )

    def _calculate_priority(self, pax: PassengerContext) -> float:
        base = _LOYALTY_PRIORITY.get(pax.loyalty_tier, 0.5)
        class_mult = _CLASS_PRIORITY.get(pax.ticket_class, 0.6)
        score = (base + class_mult) / 2

        # Vulnerable passengers always get maximum priority
        if pax.is_unaccompanied_minor or pax.has_medical:
            score = 1.0
        elif pax.has_wheelchair:
            score = min(score + 0.2, 1.0)

        return round(score, 3)

    def _select_action(
        self,
        flight: FlightContext,
        pax: PassengerContext,
        mct_passed: Optional[bool],
    ) -> RecoveryAction:
        dtype = flight.disruption_type
        delay_h = flight.delay_minutes / 60.0

        if dtype == DisruptionType.CANCELLATION:
            if delay_h > 5:
                return RecoveryAction.REBOOK_INTERLINE
            return RecoveryAction.REBOOK_SAME_CARRIER

        if dtype == DisruptionType.MISSED_CONNECTION or mct_passed is False:
            return RecoveryAction.REBOOK_SAME_CARRIER

        if dtype == DisruptionType.DIVERSION:
            return RecoveryAction.HOTEL_OVERNIGHT

        if dtype == DisruptionType.DELAY:
            if delay_h >= 5:
                return RecoveryAction.HOTEL_OVERNIGHT
            if delay_h >= 3:
                return RecoveryAction.REBOOK_SAME_CARRIER
            return RecoveryAction.HOLD_FOR_LATE_CONNECT

        return RecoveryAction.REBOOK_SAME_CARRIER

    def _duty_of_care(self, flight: FlightContext) -> tuple[bool, bool, bool]:
        delay_h = flight.delay_minutes / 60.0
        dtype = flight.disruption_type

        meal = delay_h >= 2 or dtype in (DisruptionType.CANCELLATION, DisruptionType.DIVERSION)
        hotel = delay_h >= 5 or dtype == DisruptionType.DIVERSION
        transport = hotel or dtype == DisruptionType.DIVERSION

        return meal, hotel, transport

    def _build_reasoning(
        self,
        flight: FlightContext,
        pax: PassengerContext,
        action: RecoveryAction,
        compensation_eur: float,
        mct_passed: Optional[bool],
    ) -> str:
        parts = [
            f"Disruption: {flight.disruption_type.value} on {flight.flight_number}",
            f"Delay: {flight.delay_minutes} min",
            f"Passenger: {pax.ticket_class} / {pax.loyalty_tier}",
            f"Action: {action.value}",
        ]
        if compensation_eur > 0:
            parts.append(f"EU261 compensation: €{compensation_eur:.0f}")
        if mct_passed is not None:
            parts.append(f"MCT check: {'PASSED' if mct_passed else 'FAILED'}")
        return " | ".join(parts)

    def handle_flight_update(
        self,
        flight_number: str,
        new_eta: Optional[datetime] = None,
        new_std: Optional[datetime] = None,
    ) -> list[ConnectionRecord]:
        """Called when a live flight status update arrives from the ingestion layer.

        Returns all ConnectionRecords whose status changed so the Hub Control
        dashboard can push real-time alerts.
        """
        affected: list[ConnectionRecord] = []
        if new_eta:
            affected.extend(self._act_tracker.update_inbound_eta(flight_number, new_eta))
        if new_std:
            affected.extend(self._act_tracker.update_outbound_std(flight_number, new_std))
        return affected
