from app.models.compensation import CompensationResult

class EU261Calculator:
    """
    Calculator for EU261/2004 Regulation passenger compensations.
    
    Rules:
    - Distance <= 1500 km: 250 EUR
    - Distance 1500 - 3500 km: 400 EUR
    - Distance > 3500 km: 600 EUR
    
    If passenger is rebooked and arrives at final destination with delay of:
    - < 2h (<=1500km), < 3h (1500-3500km), < 4h (>3500km): 50% reduction in compensation
    If delay is < 3h at arrival: 0 EUR compensation (delay thresholds)
    """

    @staticmethod
    def calculate_compensation(
        passenger_id: int,
        distance_km: float,
        delay_hours: float,
        is_eu_flight: bool = True
    ) -> CompensationResult:
        if not is_eu_flight:
            return CompensationResult(
                passenger_id=passenger_id,
                distance_km=distance_km,
                delay_hours=delay_hours,
                amount_eur=0.0,
                category="NONE"
            )

        if delay_hours < 3.0:
            # Under 3 hours delay at final destination -> No compensation
            return CompensationResult(
                passenger_id=passenger_id,
                distance_km=distance_km,
                delay_hours=delay_hours,
                amount_eur=0.0,
                category="NONE"
            )

        # Base Compensation amounts based on distance
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

        # Apply 50% reduction if rebooked flight arrives within reasonable window
        # (This applies to cancellation rebookings where delay is minimal)
        if delay_hours <= reduction_threshold:
            amount *= 0.5

        return CompensationResult(
            passenger_id=passenger_id,
            distance_km=distance_km,
            delay_hours=delay_hours,
            amount_eur=amount,
            category=category
        )
