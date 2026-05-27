import asyncio
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import async_session_maker, Base, engine
from app.db.models import PassengerDB, FlightDB
from app.models.passenger import TicketClass, LoyaltyTier
from app.models.flight import FlightStatus

async def seed_data(session: AsyncSession):
    # Check if we already have passengers
    result = await session.execute(select(PassengerDB))
    if result.scalars().first() is not None:
        print("Database already has data. Skipping seed.")
        return

    print("Seeding flights...")
    now = datetime.utcnow()
    
    flights = [
        # The main flights affected by cancellations
        FlightDB(
            flight_number="TK1981", origin="IST", destination="LHR",
            scheduled_departure=now + timedelta(hours=3), scheduled_arrival=now + timedelta(hours=7),
            status=FlightStatus.SCHEDULED, aircraft_type="Boeing 777-300ER",
            total_capacity=300, available_seats=0, distance_km=2500.0
        ),
        FlightDB(
            flight_number="TK1821", origin="IST", destination="CDG",
            scheduled_departure=now + timedelta(hours=4), scheduled_arrival=now + timedelta(hours=8),
            status=FlightStatus.SCHEDULED, aircraft_type="Airbus A330-300",
            total_capacity=289, available_seats=0, distance_km=2200.0
        ),
        # Alternative recovery flights with open seats
        FlightDB(
            flight_number="TK1983", origin="IST", destination="LHR",
            scheduled_departure=now + timedelta(hours=6), scheduled_arrival=now + timedelta(hours=10),
            status=FlightStatus.SCHEDULED, aircraft_type="Airbus A350-900",
            total_capacity=329, available_seats=40, distance_km=2500.0
        ),
        FlightDB(
            flight_number="TK1985", origin="IST", destination="LHR",
            scheduled_departure=now + timedelta(hours=12), scheduled_arrival=now + timedelta(hours=16),
            status=FlightStatus.SCHEDULED, aircraft_type="Boeing 787-9",
            total_capacity=300, available_seats=120, distance_km=2500.0
        ),
        FlightDB(
            flight_number="TK1823", origin="IST", destination="CDG",
            scheduled_departure=now + timedelta(hours=8), scheduled_arrival=now + timedelta(hours=12),
            status=FlightStatus.SCHEDULED, aircraft_type="Airbus A321neo",
            total_capacity=190, available_seats=25, distance_km=2200.0
        ),
        FlightDB(
            flight_number="TK1587", origin="IST", destination="FRA",
            scheduled_departure=now + timedelta(hours=5), scheduled_arrival=now + timedelta(hours=8),
            status=FlightStatus.SCHEDULED, aircraft_type="Airbus A321neo",
            total_capacity=190, available_seats=15, distance_km=1800.0
        ),
        FlightDB(
            flight_number="TK2108", origin="ESB", destination="SAW",
            scheduled_departure=now + timedelta(hours=2), scheduled_arrival=now + timedelta(hours=3),
            status=FlightStatus.SCHEDULED, aircraft_type="Boeing 737 MAX 8",
            total_capacity=165, available_seats=80, distance_km=350.0
        )
    ]
    
    session.add_all(flights)
    await session.flush() # Get IDs

    print("Seeding passengers...")
    passengers = []
    
    # Let's seed 50 passengers
    first_names = ["Ahmet", "Mehmet", "Ayşe", "Fatma", "Mustafa", "Emine", "Ali", "Hatice", "Hüseyin", "Zeynep",
                   "John", "Sarah", "David", "Emma", "Michael", "Olivia", "Jean", "Marie", "Pierre", "Sophie",
                   "Murat", "Can", "Ece", "Deniz", "Selim", "Yasemin", "Oğuz", "Dilek", "Hakan", "Büşra",
                   "James", "Robert", "Patricia", "Linda", "Elizabeth", "William", "Richard", "Thomas", "Charles", "Barbara",
                   "Kerem", "Aslı", "Burak", "Gamze", "Selin", "Tariq", "Fatima", "Youssef", "Layla", "Amir"]
    
    last_names = ["Yılmaz", "Kaya", "Demir", "Çelik", "Şahin", "Yıldız", "Öztürk", "Aydın", "Özdemir", "Arslan",
                  "Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia", "Rodriguez", "Wilson",
                  "Koç", "Sabancı", "Bulut", "Tekin", "Acar", "Güneş", "Yıldırım", "Kılıç", "Aslan", "Karataş",
                  "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Wood", "Lewis",
                  "Erdoğan", "Şen", "Aksoy", "Sarı", "Avcı", "Al-Farsi", "Haddad", "Mansoor", "Said", "Rahman"]

    for i in range(50):
        # Assign first 25 to LHR (TK1981), next 25 to CDG (TK1821)
        pnr = f"PNR{100 + i}"
        ticket_class = TicketClass.ECONOMY
        if i % 7 == 0:
            ticket_class = TicketClass.FIRST
        elif i % 5 == 0:
            ticket_class = TicketClass.BUSINESS
            
        loyalty_tier = LoyaltyTier.NONE
        if i % 6 == 0:
            loyalty_tier = LoyaltyTier.PLATINUM
        elif i % 4 == 0:
            loyalty_tier = LoyaltyTier.GOLD
        elif i % 3 == 0:
            loyalty_tier = LoyaltyTier.SILVER
            
        special_needs = None
        if i % 12 == 0:
            special_needs = "Wheelchair required"
        elif i % 15 == 0:
            special_needs = "Unaccompanied minor"

        passengers.append(PassengerDB(
            pnr=pnr,
            first_name=first_names[i],
            last_name=last_names[i],
            email=f"{first_names[i].lower()}.{last_names[i].lower()}{i}@example.com",
            phone=f"+90555{1000000 + i}",
            ticket_class=ticket_class,
            loyalty_tier=loyalty_tier,
            special_needs=special_needs,
            booking_reference=f"BK-{200000 + i}"
        ))

    session.add_all(passengers)
    await session.commit()
    print("Database seeding completed successfully.")

async def run_seed():
    async with async_session_maker() as session:
        await seed_data(session)

if __name__ == "__main__":
    asyncio.run(run_seed())
