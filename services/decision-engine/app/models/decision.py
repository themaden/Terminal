from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel


class DecisionAction(StrEnum):
    REBOOK = "REBOOK"
    COMPENSATE = "COMPENSATE"
    HOTEL = "HOTEL"
    MEAL = "MEAL"
    REFUND = "REFUND"
    NO_ACTION = "NO_ACTION"

class DecisionStatus(StrEnum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXECUTED = "EXECUTED"

class Decision(BaseModel):
    id: int | None = None
    crisis_id: int
    passenger_id: int
    action: DecisionAction
    new_flight_id: int | None = None
    compensation_amount_eur: float = 0.0
    hotel_name: str | None = None
    status: DecisionStatus = DecisionStatus.PENDING
    agent_confidence: float = 1.0
    agent_reasoning: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True
