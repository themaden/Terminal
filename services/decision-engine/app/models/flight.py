from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class FlightStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    DELAYED = "DELAYED"
    CANCELLED = "CANCELLED"
    DIVERTED = "DIVERTED"

class Flight(BaseModel):
    id: Optional[int] = None
    flight_number: str
    origin: str = Field(..., min_length=3, max_length=3, description="3-letter airport code (IATA)")
    destination: str = Field(..., min_length=3, max_length=3, description="3-letter airport code (IATA)")
    scheduled_departure: datetime
    scheduled_arrival: datetime
    status: FlightStatus = FlightStatus.SCHEDULED
    aircraft_type: str
    total_capacity: int
    available_seats: int
    distance_km: float
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
