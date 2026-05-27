from enum import Enum
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

class DecisionAction(str, Enum):
    REBOOK = "REBOOK"
    COMPENSATE = "COMPENSATE"
    HOTEL = "HOTEL"
    MEAL = "MEAL"
    REFUND = "REFUND"
    NO_ACTION = "NO_ACTION"

class DecisionStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXECUTED = "EXECUTED"

class Decision(BaseModel):
    id: Optional[int] = None
    crisis_id: int
    passenger_id: int
    action: DecisionAction
    new_flight_id: Optional[int] = None
    compensation_amount_eur: float = 0.0
    hotel_name: Optional[str] = None
    status: DecisionStatus = DecisionStatus.PENDING
    agent_confidence: float = 1.0
    agent_reasoning: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
