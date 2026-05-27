from dataclasses import dataclass
from typing import List, Dict, Tuple, Optional
from app.models.passenger import Passenger
from app.models.flight import Flight

@dataclass
class OptimizationInput:
    passengers: List[Passenger]
    alternative_flights: List[Flight]
    # Map from passenger ID to dict of costs for each flight ID
    rebooking_costs: Dict[int, Dict[int, float]]
    # Maximum capacity of each alternative flight
    flight_capacities: Dict[int, int]

@dataclass
class OptimizationResult:
    # Map from passenger ID to assigned flight ID (or None if no flight assigned)
    assignments: Dict[int, Optional[int]]
    total_cost: float
    status: str
