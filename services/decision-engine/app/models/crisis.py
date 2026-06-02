from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class CrisisType(StrEnum):
    CANCELLATION = "CANCELLATION"
    DELAY = "DELAY"
    DIVERSION = "DIVERSION"

class CrisisSeverity(StrEnum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class CrisisStatus(StrEnum):
    ACTIVE = "ACTIVE"
    RESOLVING = "RESOLVING"
    RESOLVED = "RESOLVED"

class CrisisEvent(BaseModel):
    id: int | None = None
    crisis_type: CrisisType
    affected_flight_id: int
    reason: str
    severity: CrisisSeverity = CrisisSeverity.MEDIUM
    triggered_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: datetime | None = None
    status: CrisisStatus = CrisisStatus.ACTIVE
    affected_passenger_count: int = 0

    class Config:
        from_attributes = True


class CrisisCreate(BaseModel):
    flight_number: str
    crisis_type: CrisisType
    reason: str
    severity: CrisisSeverity = CrisisSeverity.MEDIUM


class CrisisStatusUpdate(BaseModel):
    status: CrisisStatus

