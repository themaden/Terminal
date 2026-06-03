"""
Minimum Connection Time (MCT) Calculator
─────────────────────────────────────────
Source: IATA SSIM Chapter 5 / THY Operasyon Kılavuzu
IST (LTFM): II = 75 dk  (PDF referansı — büyük terminal, uzun yürüme mesafesi)
WCHR eki  : +15 dk (IATA PRM kılavuzu)
UMNR eki  : +20 dk (refakatsiz çocuk prosedürü)
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class ConnectionType(str, Enum):
    DD = "DD"   # Domestic   → Domestic
    DI = "DI"   # Domestic   → International
    ID = "ID"   # International → Domestic
    II = "II"   # International → International


@dataclass
class MCTResult:
    airport: str
    connection_type: ConnectionType
    mct_minutes: int
    is_connection_feasible: bool
    available_minutes: int
    buffer_minutes: int
    short_connection_alert: bool = False
    routing_instruction: Optional[str] = None   # IST F8 yönlendirmesi vs.


# ─── MCT tablosu (dakika) ────────────────────────────────────────────────────
# LTFM (IST): PDF referansı — "IST ortalama uluslararası MCT 75 dakika"
_MCT_TABLE: dict[str, dict[ConnectionType, int]] = {
    "LTFM": {   # İstanbul Havalimanı — THY ana hub
        ConnectionType.DD: 50,   # iç hat → iç hat
        ConnectionType.DI: 65,   # iç hat → dış hat
        ConnectionType.ID: 65,   # dış hat → iç hat
        ConnectionType.II: 75,   # dış hat → dış hat  ← PDF: 75 dk
    },
    "LTFJ": {   # İstanbul Sabiha Gökçen
        ConnectionType.DD: 35,
        ConnectionType.DI: 50,
        ConnectionType.ID: 50,
        ConnectionType.II: 50,
    },
    "EHAM": {   # Amsterdam Schiphol
        ConnectionType.DD: 40,
        ConnectionType.DI: 50,
        ConnectionType.ID: 50,
        ConnectionType.II: 50,
    },
    "EDDF": {   # Frankfurt
        ConnectionType.DD: 45,
        ConnectionType.DI: 60,
        ConnectionType.ID: 60,
        ConnectionType.II: 45,
    },
    "EGLL": {   # London Heathrow
        ConnectionType.DD: 60,
        ConnectionType.DI: 75,
        ConnectionType.ID: 75,
        ConnectionType.II: 60,
    },
    "OMDB": {   # Dubai DXB
        ConnectionType.DD: 45,
        ConnectionType.DI: 60,
        ConnectionType.ID: 60,
        ConnectionType.II: 60,
    },
    "OTHH": {   # Doha DOH
        ConnectionType.DD: 45,
        ConnectionType.DI: 60,
        ConnectionType.ID: 60,
        ConnectionType.II: 45,
    },
    "LFPG": {   # Paris CDG
        ConnectionType.DD: 40,
        ConnectionType.DI: 55,
        ConnectionType.ID: 55,
        ConnectionType.II: 45,
    },
    "KJFK": {   # New York JFK
        ConnectionType.DD: 70,
        ConnectionType.DI: 90,
        ConnectionType.ID: 90,
        ConnectionType.II: 90,
    },
    "VHHH": {   # Hong Kong
        ConnectionType.DD: 60,
        ConnectionType.DI: 60,
        ConnectionType.ID: 60,
        ConnectionType.II: 60,
    },
    "RJTT": {   # Tokyo Haneda
        ConnectionType.DD: 60,
        ConnectionType.DI: 70,
        ConnectionType.ID: 70,
        ConnectionType.II: 90,
    },
    "DEFAULT": {
        ConnectionType.DD: 45,
        ConnectionType.DI: 60,
        ConnectionType.ID: 60,
        ConnectionType.II: 60,
    },
}

# ─── IST F8 "Kısa Bağlantı" eşiği ──────────────────────────────────────────
# MCT'ye uygun ama tampon < 20 dk olan yolcular F8'e yönlendirilir
_SHORT_CONNECTION_THRESHOLD_MINUTES = 20

# IST'e özel kısa bağlantı noktaları
_IST_SHORT_CONNECTION_GATES = {
    "II": "F8 — Uluslararası Kısa Bağlantı Güvenlik Noktası",
    "ID": "E3 — Uluslararası→İç Hat Kısa Bağlantı",
    "DI": "B1 — İç Hat→Uluslararası Kısa Bağlantı",
    "DD": "A2 — İç Hat Kısa Bağlantı",
}

_AIRPORT_COUNTRY: dict[str, str] = {
    "LTFM": "TR", "LTFJ": "TR", "LTBA": "TR", "LTAI": "TR",
    "LTBJ": "TR", "LTBS": "TR", "LTFE": "TR", "LTCC": "TR",
    "EGLL": "GB", "EGKK": "GB", "EGGW": "GB",
    "LFPG": "FR", "LFPO": "FR",
    "EDDF": "DE", "EDDM": "DE", "EDDB": "DE",
    "EHAM": "NL",
    "KJFK": "US", "KLAX": "US", "KORD": "US", "KATL": "US",
    "OMDB": "AE", "OTHH": "QA",
    "VHHH": "HK", "RJTT": "JP",
}


class MCTCalculator:
    """IATA SSIM Bölüm 5 referanslı MCT/ACT hesaplayıcı."""

    @staticmethod
    def get_connection_type(
        inbound_origin_icao: str,
        inbound_dest_icao: str,
        outbound_dest_icao: str,
    ) -> ConnectionType:
        hub = inbound_dest_icao
        inb_country = _AIRPORT_COUNTRY.get(inbound_origin_icao)
        hub_country  = _AIRPORT_COUNTRY.get(hub)
        out_country  = _AIRPORT_COUNTRY.get(outbound_dest_icao)

        inb_dom = inb_country == hub_country if inb_country and hub_country else False
        out_dom = out_country == hub_country if out_country and hub_country else False

        if inb_dom and out_dom:     return ConnectionType.DD
        if inb_dom and not out_dom: return ConnectionType.DI
        if not inb_dom and out_dom: return ConnectionType.ID
        return ConnectionType.II

    @staticmethod
    def get_mct(airport_icao: str, connection_type: ConnectionType) -> int:
        table = _MCT_TABLE.get(airport_icao, _MCT_TABLE["DEFAULT"])
        return table.get(connection_type, 60)

    @classmethod
    def check_connection(
        cls,
        airport_icao: str,
        inbound_arrival_minutes: int,
        outbound_departure_minutes: int,
        inbound_origin_icao: str = "",
        outbound_dest_icao: str = "",
        passenger_needs_wheelchair: bool = False,
        passenger_is_umnr: bool = False,       # Refakatsiz çocuk
        passenger_is_prm: bool = False,         # Hareket kısıtlı yolcu
    ) -> MCTResult:
        """
        Bağlantı fizibilite kontrolü — IATA SSIM + THY IST prosedürleri.

        IST-özel: tampon < 20 dk ise F8 Kısa Bağlantı noktası yönlendirmesi üretilir.
        WCHR: +15 dk | UMNR: +20 dk | PRM: +15 dk (IATA PRM Guidelines)
        """
        conn_type = cls.get_connection_type(inbound_origin_icao, airport_icao, outbound_dest_icao)
        mct = cls.get_mct(airport_icao, conn_type)

        if passenger_needs_wheelchair or passenger_is_prm:
            mct += 15
        if passenger_is_umnr:
            mct += 20

        available = outbound_departure_minutes - inbound_arrival_minutes
        buffer    = available - mct
        feasible  = available >= mct

        # IST F8 kısa bağlantı yönlendirmesi
        routing = None
        short_alert = False
        if airport_icao == "LTFM" and feasible and buffer < _SHORT_CONNECTION_THRESHOLD_MINUTES:
            short_alert = True
            gate = _IST_SHORT_CONNECTION_GATES.get(conn_type.value, "F8")
            routing = (
                f"KISA BAĞLANTI UYARISI — Lütfen doğrudan {gate} güvenlik "
                f"noktasına gidin. Bekleme yapmayın. Kalan süre: {available} dk."
            )
        elif airport_icao == "LTFM" and not feasible:
            routing = "Bağlantı kaçırılacak — Transfer masasına yönlendirin veya yeniden rezervasyon başlatın."

        return MCTResult(
            airport=airport_icao,
            connection_type=conn_type,
            mct_minutes=mct,
            is_connection_feasible=feasible,
            available_minutes=available,
            buffer_minutes=buffer,
            short_connection_alert=short_alert,
            routing_instruction=routing,
        )


def get_ist_short_connection_instructions(conn_type: str, available_minutes: int) -> dict:
    """IST terminali kısa bağlantı prosedür paketi."""
    gate = _IST_SHORT_CONNECTION_GATES.get(conn_type, "F8")
    return {
        "gate": gate,
        "message_tr": f"Kısa bağlantınız var. {gate} noktasına gidin. Süreniz: {available_minutes} dk.",
        "message_en": f"Short connection. Proceed to {gate} security. Time remaining: {available_minutes} min.",
        "priority_lane": True,
        "baggage_note": "Bagajınız doğrudan aktarılacaktır — bagaj bantlarına gitmenize gerek yok.",
        "staff_escort": available_minutes < 45,
    }
