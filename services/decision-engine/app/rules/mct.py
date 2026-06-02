"""Minimum Connection Time (MCT) Calculator.

MCT is the minimum elapsed time required for a passenger to connect between
two flights at an airport. Values come from airline ops manuals and airport
authority publications. IATA publishes MCT tables in the IATA SHD (SSIM).
"""

from dataclasses import dataclass
from enum import Enum


class ConnectionType(str, Enum):
    DD = "DD"  # Domestic → Domestic
    DI = "DI"  # Domestic → International
    ID = "ID"  # International → Domestic
    II = "II"  # International → International


@dataclass
class MCTResult:
    airport: str
    connection_type: ConnectionType
    mct_minutes: int
    is_connection_feasible: bool
    available_minutes: int
    buffer_minutes: int  # available_minutes - mct_minutes


# Published MCT tables (minutes) per airport.
# Source: IATA SSIM Chapter 5 / airline operational specifications.
# Format: {ICAO: {ConnectionType: minutes}}
_MCT_TABLE: dict[str, dict[ConnectionType, int]] = {
    # Istanbul (IST)
    "LTFM": {
        ConnectionType.DD: 45,
        ConnectionType.DI: 60,
        ConnectionType.ID: 60,
        ConnectionType.II: 60,
    },
    # Istanbul Sabiha Gökçen (SAW)
    "LTFJ": {
        ConnectionType.DD: 35,
        ConnectionType.DI: 50,
        ConnectionType.ID: 50,
        ConnectionType.II: 50,
    },
    # Amsterdam Schiphol (AMS)
    "EHAM": {
        ConnectionType.DD: 40,
        ConnectionType.DI: 50,
        ConnectionType.ID: 50,
        ConnectionType.II: 50,
    },
    # Frankfurt (FRA)
    "EDDF": {
        ConnectionType.DD: 45,
        ConnectionType.DI: 60,
        ConnectionType.ID: 60,
        ConnectionType.II: 45,
    },
    # London Heathrow (LHR)
    "EGLL": {
        ConnectionType.DD: 60,
        ConnectionType.DI: 75,
        ConnectionType.ID: 75,
        ConnectionType.II: 60,
    },
    # Dubai (DXB)
    "OMDB": {
        ConnectionType.DD: 45,
        ConnectionType.DI: 60,
        ConnectionType.ID: 60,
        ConnectionType.II: 60,
    },
    # Doha (DOH)
    "OTHH": {
        ConnectionType.DD: 45,
        ConnectionType.DI: 60,
        ConnectionType.ID: 60,
        ConnectionType.II: 45,
    },
    # Paris CDG (CDG)
    "LFPG": {
        ConnectionType.DD: 40,
        ConnectionType.DI: 55,
        ConnectionType.ID: 55,
        ConnectionType.II: 45,
    },
    # New York JFK (JFK)
    "KJFK": {
        ConnectionType.DD: 70,
        ConnectionType.DI: 90,
        ConnectionType.ID: 90,
        ConnectionType.II: 90,
    },
    # Default / unknown airports
    "DEFAULT": {
        ConnectionType.DD: 45,
        ConnectionType.DI: 60,
        ConnectionType.ID: 60,
        ConnectionType.II: 60,
    },
}

# IATA domestic country codes: flights within these pairs are DOMESTIC.
_DOMESTIC_COUNTRIES: dict[str, str] = {
    "TR": "Turkey",
    "US": "United States",
    "DE": "Germany",
    "FR": "France",
    "GB": "United Kingdom",
    "NL": "Netherlands",
}

# Airport → country mapping for domestic/international determination
_AIRPORT_COUNTRY: dict[str, str] = {
    "LTFM": "TR", "LTFJ": "TR", "LTBA": "TR",
    "LTAI": "TR", "LTBJ": "TR", "LTBS": "TR",
    "LTFE": "TR", "LTCC": "TR",
    "EGLL": "GB", "EGKK": "GB", "EGGW": "GB",
    "LFPG": "FR", "LFPO": "FR",
    "EDDF": "DE", "EDDM": "DE", "EDDB": "DE",
    "EHAM": "NL",
    "KJFK": "US", "KLAX": "US", "KORD": "US", "KATL": "US",
    "OMDB": "AE", "OTHH": "QA",
}


class MCTCalculator:
    """Calculates whether a connection is feasible given available time and MCT."""

    @staticmethod
    def get_connection_type(
        inbound_origin_icao: str,
        inbound_dest_icao: str,
        outbound_dest_icao: str,
    ) -> ConnectionType:
        hub = inbound_dest_icao
        inbound_country = _AIRPORT_COUNTRY.get(inbound_origin_icao)
        hub_country = _AIRPORT_COUNTRY.get(hub)
        outbound_country = _AIRPORT_COUNTRY.get(outbound_dest_icao)

        inbound_domestic = inbound_country == hub_country if inbound_country and hub_country else False
        outbound_domestic = outbound_country == hub_country if outbound_country and hub_country else False

        if inbound_domestic and outbound_domestic:
            return ConnectionType.DD
        if inbound_domestic and not outbound_domestic:
            return ConnectionType.DI
        if not inbound_domestic and outbound_domestic:
            return ConnectionType.ID
        return ConnectionType.II

    @staticmethod
    def get_mct(airport_icao: str, connection_type: ConnectionType) -> int:
        """Returns MCT in minutes for the given airport and connection type."""
        table = _MCT_TABLE.get(airport_icao, _MCT_TABLE["DEFAULT"])
        return table.get(connection_type, 60)

    @classmethod
    def check_connection(
        cls,
        airport_icao: str,
        inbound_arrival_minutes: int,   # minutes from now
        outbound_departure_minutes: int,  # minutes from now
        inbound_origin_icao: str = "",
        outbound_dest_icao: str = "",
        passenger_needs_wheelchair: bool = False,
    ) -> MCTResult:
        """
        Determine if a connection is feasible.

        Args:
            airport_icao: ICAO code of the hub/transfer airport.
            inbound_arrival_minutes: ETA of inbound flight in minutes from now.
            outbound_departure_minutes: STD of outbound flight in minutes from now.
            inbound_origin_icao: Origin of the inbound leg (for Dom/Int classification).
            outbound_dest_icao: Destination of the outbound leg.
            passenger_needs_wheelchair: WCHR passengers get extra buffer per IATA spec.

        Returns:
            MCTResult with feasibility verdict and buffer minutes.
        """
        connection_type = cls.get_connection_type(
            inbound_origin_icao, airport_icao, outbound_dest_icao
        )
        mct = cls.get_mct(airport_icao, connection_type)

        # IATA WCHR rule: add 15 minutes to MCT
        if passenger_needs_wheelchair:
            mct += 15

        available = outbound_departure_minutes - inbound_arrival_minutes
        buffer = available - mct

        return MCTResult(
            airport=airport_icao,
            connection_type=connection_type,
            mct_minutes=mct,
            is_connection_feasible=available >= mct,
            available_minutes=available,
            buffer_minutes=buffer,
        )
