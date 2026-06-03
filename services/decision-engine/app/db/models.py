from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.db.database import Base
from app.models.crisis import CrisisSeverity, CrisisStatus, CrisisType
from app.models.decision import DecisionAction, DecisionStatus
from app.models.flight import FlightStatus


class UserDB(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(200), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="operator")
    avatar = Column(String(10), nullable=False, default="OP")
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_login = Column(DateTime, nullable=True)
from app.models.passenger import LoyaltyTier, TicketClass


class PassengerDB(Base):
    __tablename__ = "passengers"

    id = Column(Integer, primary_key=True, index=True)
    pnr = Column(String(6), unique=True, index=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=False)
    ticket_class = Column(SQLEnum(TicketClass), default=TicketClass.ECONOMY, nullable=False)
    loyalty_tier = Column(SQLEnum(LoyaltyTier), default=LoyaltyTier.NONE, nullable=False)
    special_needs = Column(String(255), nullable=True)
    booking_reference = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    decisions = relationship("DecisionDB", back_populates="passenger")

class FlightDB(Base):
    __tablename__ = "flights"

    id = Column(Integer, primary_key=True, index=True)
    flight_number = Column(String(20), unique=True, index=True, nullable=False)
    origin = Column(String(3), nullable=False)
    destination = Column(String(3), nullable=False)
    scheduled_departure = Column(DateTime, nullable=False)
    scheduled_arrival = Column(DateTime, nullable=False)
    status = Column(SQLEnum(FlightStatus), default=FlightStatus.SCHEDULED, nullable=False)
    aircraft_type = Column(String(50), nullable=False)
    total_capacity = Column(Integer, nullable=False)
    available_seats = Column(Integer, nullable=False)
    distance_km = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    crises = relationship("CrisisDB", back_populates="affected_flight")

class CrisisDB(Base):
    __tablename__ = "crises"

    id = Column(Integer, primary_key=True, index=True)
    crisis_type = Column(SQLEnum(CrisisType), nullable=False)
    affected_flight_id = Column(Integer, ForeignKey("flights.id"), nullable=False)
    reason = Column(String(255), nullable=False)
    severity = Column(SQLEnum(CrisisSeverity), default=CrisisSeverity.MEDIUM, nullable=False)
    triggered_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    status = Column(SQLEnum(CrisisStatus), default=CrisisStatus.ACTIVE, nullable=False)
    affected_passenger_count = Column(Integer, default=0, nullable=False)

    affected_flight = relationship("FlightDB", back_populates="crises")
    decisions = relationship("DecisionDB", back_populates="crisis")

class DecisionDB(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)
    crisis_id = Column(Integer, ForeignKey("crises.id"), nullable=False)
    passenger_id = Column(Integer, ForeignKey("passengers.id"), nullable=False)
    action = Column(SQLEnum(DecisionAction), nullable=False)
    new_flight_id = Column(Integer, ForeignKey("flights.id"), nullable=True)
    compensation_amount_eur = Column(Float, default=0.0, nullable=False)
    hotel_name = Column(String(255), nullable=True)
    status = Column(SQLEnum(DecisionStatus), default=DecisionStatus.PENDING, nullable=False)
    agent_confidence = Column(Float, default=1.0, nullable=False)
    agent_reasoning = Column(String(2000), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    crisis = relationship("CrisisDB", back_populates="decisions")
    passenger = relationship("PassengerDB", back_populates="decisions")
    new_flight = relationship("FlightDB")

class AuditLogDB(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    crisis_id = Column(Integer, ForeignKey("crises.id"), nullable=True)
    agent_name = Column(String(100), nullable=False)
    action = Column(String(255), nullable=False)
    details = Column(String(2000), nullable=False)
    confidence = Column(Float, default=1.0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
