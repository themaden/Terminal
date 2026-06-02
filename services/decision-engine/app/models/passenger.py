from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, EmailStr, Field


class TicketClass(StrEnum):
    ECONOMY = "ECONOMY"
    BUSINESS = "BUSINESS"
    FIRST = "FIRST"

class LoyaltyTier(StrEnum):
    NONE = "NONE"
    SILVER = "SILVER"
    GOLD = "GOLD"
    PLATINUM = "PLATINUM"

class Passenger(BaseModel):
    id: int | None = None
    pnr: str = Field(..., min_length=6, max_length=6, description="6-character PNR code")
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    ticket_class: TicketClass = TicketClass.ECONOMY
    loyalty_tier: LoyaltyTier = LoyaltyTier.NONE
    special_needs: str | None = None
    booking_reference: str
    created_at: datetime | None = None

    class Config:
        from_attributes = True
