from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI, status
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.routes.crisis import router as crisis_router
from app.db.database import get_db
from app.db.models import CrisisDB, FlightDB
from app.models.crisis import CrisisEvent, CrisisSeverity, CrisisStatus, CrisisType


@pytest.fixture
def test_app(db_session: AsyncSession):
    app = FastAPI()
    app.include_router(crisis_router)
    app.dependency_overrides[get_db] = lambda: db_session
    return app


@pytest.fixture
def client(test_app):
    return TestClient(test_app)


@pytest.mark.anyio
async def test_list_crises_empty(client):
    response = client.get("/crisis/")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


@pytest.mark.anyio
async def test_get_crisis_not_found(client):
    response = client.get("/crisis/999")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "not found" in response.json()["detail"]


@pytest.mark.anyio
async def test_create_crisis_success(client, db_session: AsyncSession):
    # Seed a flight first so we can trigger a crisis on it
    flight = FlightDB(
        flight_number="TK1981",
        origin="IST",
        destination="LHR",
        scheduled_departure=None,  # Not strictly needed or checked for basic seed, but let's mock it
        scheduled_arrival=None,
        aircraft_type="A321",
        total_capacity=180,
        available_seats=150,
        distance_km=2500,
    )
    # We need scheduled_departure for solver/cost calculation
    from datetime import datetime, timedelta
    flight.scheduled_departure = datetime.utcnow() + timedelta(hours=2)
    flight.scheduled_arrival = datetime.utcnow() + timedelta(hours=6)

    db_session.add(flight)
    await db_session.commit()

    # Mock CrisisService.trigger_crisis
    mock_crisis = CrisisEvent(
        id=1,
        crisis_type=CrisisType.CANCELLATION,
        affected_flight_id=flight.id,
        reason="Snow storm",
        severity=CrisisSeverity.HIGH,
        status=CrisisStatus.ACTIVE,
        affected_passenger_count=10,
    )

    with patch("app.services.crisis_service.CrisisService.trigger_crisis", new_callable=AsyncMock) as mock_trigger:
        mock_trigger.return_value = mock_crisis

        payload = {
            "flight_number": "TK1981",
            "crisis_type": "CANCELLATION",
            "reason": "Snow storm",
            "severity": "HIGH",
        }
        response = client.post("/crisis/", json=payload)
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["id"] == 1
        assert data["reason"] == "Snow storm"
        assert data["status"] == "ACTIVE"


@pytest.mark.anyio
async def test_update_crisis_status(client, db_session: AsyncSession):
    # Seed a flight and a crisis
    from datetime import datetime
    flight = FlightDB(
        flight_number="TK1821",
        origin="IST",
        destination="CDG",
        scheduled_departure=datetime.utcnow(),
        scheduled_arrival=datetime.utcnow(),
        aircraft_type="A321",
        total_capacity=180,
        available_seats=150,
        distance_km=2500,
    )
    db_session.add(flight)
    await db_session.flush()

    crisis = CrisisDB(
        crisis_type=CrisisType.DELAY,
        affected_flight_id=flight.id,
        reason="Technical issue",
        severity=CrisisSeverity.MEDIUM,
        status=CrisisStatus.ACTIVE,
        affected_passenger_count=5,
    )
    db_session.add(crisis)
    await db_session.commit()

    # Update status to RESOLVED
    payload = {"status": "RESOLVED"}
    response = client.patch(f"/crisis/{crisis.id}/status", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "RESOLVED"
    assert data["resolved_at"] is not None


@pytest.mark.anyio
async def test_retry_crisis(client, db_session: AsyncSession):
    # Seed flight and crisis
    from datetime import datetime
    flight = FlightDB(
        flight_number="TK1983",
        origin="IST",
        destination="LHR",
        scheduled_departure=datetime.utcnow(),
        scheduled_arrival=datetime.utcnow(),
        aircraft_type="A321",
        total_capacity=180,
        available_seats=150,
        distance_km=2500,
    )
    db_session.add(flight)
    await db_session.flush()

    crisis = CrisisDB(
        crisis_type=CrisisType.CANCELLATION,
        affected_flight_id=flight.id,
        reason="Snow storm",
        severity=CrisisSeverity.HIGH,
        status=CrisisStatus.ACTIVE,
        affected_passenger_count=10,
    )
    db_session.add(crisis)
    await db_session.commit()

    # Mock CrisisService.process_crisis
    with patch("app.services.crisis_service.CrisisService.process_crisis", new_callable=AsyncMock) as mock_process:
        mock_process.return_value = None

        response = client.post(f"/crisis/{crisis.id}/retry")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert f"Crisis {crisis.id} processed successfully" in data["message"]
        mock_process.assert_called_once()
