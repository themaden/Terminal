"""Actual Connection Time (ACT) Tracker.

ACT tracks whether passengers making a connection have physically enough time
given real-time flight arrivals and departures. Unlike MCT (published minimum),
ACT works with live operational data and triggers rebooking alerts when a
connection is at risk.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum


class ConnectionStatus(str, Enum):
    OK = "OK"                    # ACT > MCT, connection is safe
    AT_RISK = "AT_RISK"         # ACT within 10 min of MCT, proactive action recommended
    CRITICAL = "CRITICAL"       # ACT < MCT but flight not yet closed
    MISSED = "MISSED"           # Departure gate already closed


@dataclass
class ConnectionRecord:
    passenger_pnr: str
    inbound_flight: str
    outbound_flight: str
    hub_airport: str
    inbound_eta: datetime        # actual/estimated arrival of inbound flight
    outbound_std: datetime       # scheduled/current departure of outbound flight
    mct_minutes: int
    status: ConnectionStatus = ConnectionStatus.OK
    act_minutes: int = 0
    last_updated: datetime = field(default_factory=datetime.utcnow)
    alert_sent: bool = False

    def refresh(self, new_inbound_eta: datetime, new_outbound_std: datetime) -> "ConnectionRecord":
        self.inbound_eta = new_inbound_eta
        self.outbound_std = new_outbound_std
        self.act_minutes = int((new_outbound_std - new_inbound_eta).total_seconds() / 60)
        self.status = self._compute_status()
        self.last_updated = datetime.utcnow()
        return self

    def _compute_status(self) -> ConnectionStatus:
        if self.act_minutes < 0:
            return ConnectionStatus.MISSED
        if self.act_minutes < self.mct_minutes:
            return ConnectionStatus.CRITICAL
        if self.act_minutes < self.mct_minutes + 10:
            return ConnectionStatus.AT_RISK
        return ConnectionStatus.OK


class ACTTracker:
    """
    Maintains real-time connection records for all connecting passengers.

    Called by the IRROPS engine whenever a flight status update arrives
    (delay, gate change, actual arrival time). Generates alerts for the
    Hub Control and PCC dashboard when connections become at-risk.
    """

    def __init__(self) -> None:
        self._connections: dict[str, ConnectionRecord] = {}  # key = pnr + inbound + outbound

    @staticmethod
    def _key(pnr: str, inbound: str, outbound: str) -> str:
        return f"{pnr}:{inbound}:{outbound}"

    def register(
        self,
        passenger_pnr: str,
        inbound_flight: str,
        outbound_flight: str,
        hub_airport: str,
        inbound_eta: datetime,
        outbound_std: datetime,
        mct_minutes: int,
    ) -> ConnectionRecord:
        """Register a connecting passenger pair."""
        act = int((outbound_std - inbound_eta).total_seconds() / 60)
        key = self._key(passenger_pnr, inbound_flight, outbound_flight)
        record = ConnectionRecord(
            passenger_pnr=passenger_pnr,
            inbound_flight=inbound_flight,
            outbound_flight=outbound_flight,
            hub_airport=hub_airport,
            inbound_eta=inbound_eta,
            outbound_std=outbound_std,
            mct_minutes=mct_minutes,
            act_minutes=act,
        )
        record.status = record._compute_status()
        self._connections[key] = record
        return record

    def update_inbound_eta(
        self,
        inbound_flight: str,
        new_eta: datetime,
    ) -> list[ConnectionRecord]:
        """Update all connections affected by a change in inbound ETA."""
        affected: list[ConnectionRecord] = []
        for record in self._connections.values():
            if record.inbound_flight == inbound_flight:
                record.refresh(new_eta, record.outbound_std)
                affected.append(record)
        return affected

    def update_outbound_std(
        self,
        outbound_flight: str,
        new_std: datetime,
    ) -> list[ConnectionRecord]:
        """Update all connections affected by a change in outbound departure time."""
        affected: list[ConnectionRecord] = []
        for record in self._connections.values():
            if record.outbound_flight == outbound_flight:
                record.refresh(record.inbound_eta, new_std)
                affected.append(record)
        return affected

    def get_at_risk_connections(self) -> list[ConnectionRecord]:
        """Return all connections currently at risk or critical."""
        return [
            r for r in self._connections.values()
            if r.status in (ConnectionStatus.AT_RISK, ConnectionStatus.CRITICAL)
        ]

    def get_missed_connections(self) -> list[ConnectionRecord]:
        """Return all connections that are already missed."""
        return [
            r for r in self._connections.values()
            if r.status == ConnectionStatus.MISSED
        ]

    def get_all(self) -> list[ConnectionRecord]:
        return list(self._connections.values())

    def remove(self, passenger_pnr: str, inbound_flight: str, outbound_flight: str) -> None:
        key = self._key(passenger_pnr, inbound_flight, outbound_flight)
        self._connections.pop(key, None)

    def summary(self) -> dict:
        all_records = list(self._connections.values())
        return {
            "total": len(all_records),
            "ok": sum(1 for r in all_records if r.status == ConnectionStatus.OK),
            "at_risk": sum(1 for r in all_records if r.status == ConnectionStatus.AT_RISK),
            "critical": sum(1 for r in all_records if r.status == ConnectionStatus.CRITICAL),
            "missed": sum(1 for r in all_records if r.status == ConnectionStatus.MISSED),
        }
