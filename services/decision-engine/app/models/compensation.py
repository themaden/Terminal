from pydantic import BaseModel


class CompensationResult(BaseModel):
    passenger_id: int
    regulation: str = "EU261/2004"
    distance_km: float
    delay_hours: float
    amount_eur: float
    category: str  # SHORT/MEDIUM/LONG
