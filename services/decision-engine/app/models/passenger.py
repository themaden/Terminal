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

    # Doküman §3 — öncelik hiyerarşisi sert kısıtları
    is_unaccompanied_minor: bool = False   # 1. derece: onaysız çocuk
    is_disabled: bool = False              # 1. derece: engelli yolcu
    group_id: str | None = None           # 3. derece: aile/grup kodu (bölünme yasağı)
    group_size: int = 1                   # gruptaki toplam kişi sayısı

    class Config:
        from_attributes = True
