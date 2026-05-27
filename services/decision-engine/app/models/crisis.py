from enum import Enum
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CrisisType(str, Enum):
    CANCELLATION = "CANCELLATION"
    DELAY = "DELAY"
    DIVERSION = "DIVERSION"

class CrisisSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class CrisisStatus(str, Enum):
    ACTIVE = "ACTIVE"
    RESOLVING = "RESOLVING"
    RESOLVED = "RESOLVED"

class CrisisEvent(BaseModel):
    id: Optional[int] = None
    crisis_type: CrisisType
    affected_flight_id: int
    reason: str
    severity: CrisisSeverity = CrisisSeverity.MEDIUM
    triggered_at: datetime = datetime.now
    resolved_at: Optional[datetime] = None
    status: CrisisStatus = CrisisStatus.ACTIVE
    affected_passenger_count: int = 0

    class Config:
        from_attributes = True
