from app.models.compensation import CompensationResult


class EU261Calculator:
    """
    Calculator for EU Regulation 261/2004 passenger compensations.

    Rules (distance-based base amounts):
    - Distance ≤ 1500 km  : €250
    - Distance 1500–3500 km : €400
    - Distance > 3500 km  : €600

    50% reduction applied when:
    - ≤1500 km: delay 3–2 h reduction threshold (≤2 h → 50%)
    - 1500–3500 km: delay 3–3 h threshold (≤3 h → 50%)
    - >3500 km: delay 3–4 h range (≤4 h → 50% i.e. €300)

    No compensation if delay < 3 h at final destination.
    """

    @staticmethod
    def calculate_compensation(
        passenger_id: int,
        distance_km: float,
        delay_hours: float,
        is_eu_flight: bool = True,
    ) -> CompensationResult:
        """Full method signature used by CrisisService."""
        if not is_eu_flight:
            return CompensationResult(
                passenger_id=passenger_id,
                distance_km=distance_km,
                delay_hours=delay_hours,
                amount_eur=0.0,
                category="NONE",
            )

        if delay_hours < 3.0:
            # Under 3 hours → No compensation
            return CompensationResult(
                passenger_id=passenger_id,
                distance_km=distance_km,
                delay_hours=delay_hours,
                amount_eur=0.0,
                category="NONE",
            )

        # Base amounts by distance
        if distance_km <= 1500.0:
            amount = 250.0
            category = "SHORT"
            reduction_threshold = 2.0
        elif distance_km <= 3500.0:
            amount = 400.0
            category = "MEDIUM"
            reduction_threshold = 3.0
        else:
            amount = 600.0
            category = "LONG"
            reduction_threshold = 4.0

        # 50% reduction if rebooked and arrival delay ≤ reduction_threshold
        if delay_hours <= reduction_threshold:
            amount *= 0.5

        return CompensationResult(
            passenger_id=passenger_id,
            distance_km=distance_km,
            delay_hours=delay_hours,
            amount_eur=amount,
            category=category,
        )

    def calculate(self, distance_km: float, delay_minutes: float) -> dict:
        """Simplified interface used by unit tests and external callers.

        Args:
            distance_km: Great-circle distance of the flight in kilometres.
            delay_minutes: Arrival delay at final destination in minutes.

        Returns:
            dict with 'compensation_eur' key.
        """
        delay_hours = delay_minutes / 60.0
        # Use passenger_id=0 as a sentinel for non-personalised calculations
        result = EU261Calculator.calculate_compensation(
            passenger_id=0,
            distance_km=distance_km,
            delay_hours=delay_hours,
        )
        return {"compensation_eur": result.amount_eur, "category": result.category}
