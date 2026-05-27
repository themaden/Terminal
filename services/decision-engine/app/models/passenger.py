from enum import Enum
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime

class TicketClass(str, Enum):
    ECONOMY = "ECONOMY"
    BUSINESS = "BUSINESS"
    FIRST = "FIRST"

class LoyaltyTier(str, Enum):
    NONE = "NONE"
    SILVER = "SILVER"
    GOLD = "GOLD"
    PLATINUM = "PLATINUM"

class Passenger(BaseModel):
    id: Optional[int] = None
    pnr: str = Field(..., min_length=6, max_length=6, description="6-character PNR code")
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    ticket_class: TicketClass = TicketClass.ECONOMY
    loyalty_tier: LoyaltyTier = LoyaltyTier.NONE
    special_needs: Optional[str] = None
    booking_reference: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
