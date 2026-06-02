from dataclasses import dataclass

from app.models.flight import Flight
from app.models.passenger import Passenger


@dataclass
class OptimizationInput:
    passengers: list[Passenger]
    alternative_flights: list[Flight]
    # Map from passenger ID to dict of costs for each flight ID
    rebooking_costs: dict[int, dict[int, float]]
    # Maximum capacity of each alternative flight
    flight_capacities: dict[int, int]

@dataclass
class OptimizationResult:
    # Map from passenger ID to assigned flight ID (or None if no flight assigned)
    assignments: dict[int, int | None]
    total_cost: float
    status: str
