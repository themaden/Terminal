from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.coordinator import CrisisCoordinator
from app.db.models import AuditLogDB, CrisisDB, DecisionDB, FlightDB, PassengerDB
from app.models.crisis import CrisisEvent, CrisisSeverity, CrisisStatus, CrisisType
from app.models.decision import DecisionStatus
from app.models.flight import Flight, FlightStatus
from app.models.passenger import Passenger, TicketClass
from app.optimization.solver import CrisisSolver, OptimizationInput
from app.regulations.eu261 import EU261Calculator


class CrisisService:
    """
    Core service that coordinates the entire recovery lifecycle:
    1. Triggers crisis (cancellations/delays)
    2. Identifies affected passengers
    3. Searches for alternative capacity
    4. Formulates and solves MILP optimization
    5. Dispatches multi-agent crew to refine decisions and messages
    6. Manages Human-in-the-Loop approvals
    """

    @staticmethod
    async def trigger_crisis(
        session: AsyncSession,
        flight_number: str,
        crisis_type: CrisisType,
        reason: str,
        severity: CrisisSeverity
    ) -> CrisisEvent:

        # 1. Find the affected flight
        flight_result = await session.execute(
            select(FlightDB).where(FlightDB.flight_number == flight_number)
        )
        affected_flight = flight_result.scalars().first()
        if not affected_flight:
            raise ValueError(f"Flight {flight_number} not found.")

        # Update flight status
        affected_flight.status = FlightStatus.CANCELLED if crisis_type == CrisisType.CANCELLATION else FlightStatus.DELAYED

        # 2. Query all passengers booked on this flight
        # For our seed/mock system, we select a subset of passengers
        pax_result = await session.execute(select(PassengerDB))
        all_passengers = pax_result.scalars().all()

        # Assign passengers to the crisis (we filter based on index for simulation)
        # IST-LHR (TK1981) has passengers 0 to 24
        # IST-CDG (TK1821) has passengers 25 to 49
        affected_pax = []
        if affected_flight.flight_number == "TK1981":
            affected_pax = all_passengers[:25]
        elif affected_flight.flight_number == "TK1821":
            affected_pax = all_passengers[25:50]
        else:
            affected_pax = all_passengers[:10] # Fallback

        # Create Crisis record
        crisis_db = CrisisDB(
            crisis_type=crisis_type,
            affected_flight_id=affected_flight.id,
            reason=reason,
            severity=severity,
            status=CrisisStatus.ACTIVE,
            affected_passenger_count=len(affected_pax)
        )
        session.add(crisis_db)
        await session.flush() # Get ID

        # 3. Find alternative recovery flights
        alt_flights_result = await session.execute(
            select(FlightDB).where(
                FlightDB.origin == affected_flight.origin,
                FlightDB.destination == affected_flight.destination,
                FlightDB.status == FlightStatus.SCHEDULED,
                FlightDB.flight_number != flight_number
            )
        )
        alt_flights = alt_flights_result.scalars().all()

        # Convert ORM to Pydantic models for Solver & Agents
        pax_models = [Passenger.model_validate(p) for p in affected_pax]
        alt_flight_models = [Flight.model_validate(f) for f in alt_flights]

        # 4. Formulate MILP costs
        rebooking_costs = {}
        flight_capacities = {}
        compensation_map = {}

        for f in alt_flights:
            flight_capacities[f.id] = f.available_seats

        # Calculate EU261 compensation and individual rebooking penalty costs
        calculator = EU261Calculator()
        for p in pax_models:
            rebooking_costs[p.id] = {}
            # EU261 calculation (e.g. assume 6 hours delay on LHR cancellation)
            delay = 6.0 if crisis_type == CrisisType.CANCELLATION else 3.5
            comp = calculator.calculate_compensation(p.id, affected_flight.distance_km, delay)
            compensation_map[p.id] = comp.amount_eur

            for f in alt_flight_models:
                # Operational cost = delay cost + compensation + class downgrade penalty
                # High cost if we downgrade loyalty VIPs
                base_delay_cost = (f.scheduled_departure - affected_flight.scheduled_departure).total_seconds() / 3600.0 * 50.0
                loyalty_penalty = 0.0
                if p.ticket_class == TicketClass.FIRST and f.aircraft_type == "Airbus A321neo": # Bad fit for First
                    loyalty_penalty = 1000.0
                rebooking_costs[p.id][f.id] = base_delay_cost + comp.amount_eur + loyalty_penalty

        # 5. Run MILP solver
        solver_input = OptimizationInput(
            passengers=pax_models,
            alternative_flights=alt_flight_models,
            rebooking_costs=rebooking_costs,
            flight_capacities=flight_capacities
        )
        solver = CrisisSolver(solver_input)
        opt_result = solver.solve()

        # 6. Run Multi-Agent validation
        coordinator = CrisisCoordinator()
        flights_map = {f.id: f for f in alt_flight_models}
        decisions = await coordinator.process_passenger_decisions(
            crisis_id=crisis_db.id,
            passengers=pax_models,
            flights_map=flights_map,
            assignments=opt_result.assignments,
            compensation_map=compensation_map,
            reason=reason
        )

        # Save decisions to database
        for dec in decisions:
            dec_db = DecisionDB(
                crisis_id=dec.crisis_id,
                passenger_id=dec.passenger_id,
                action=dec.action,
                new_flight_id=dec.new_flight_id,
                compensation_amount_eur=dec.compensation_amount_eur,
                hotel_name=dec.hotel_name,
                status=DecisionStatus.PENDING,
                agent_confidence=dec.agent_confidence,
                agent_reasoning=dec.agent_reasoning
            )
            session.add(dec_db)

            # Update seat capacity in flights
            if dec.new_flight_id:
                await session.execute(
                    update(FlightDB)
                    .where(FlightDB.id == dec.new_flight_id)
                    .values(available_seats=FlightDB.available_seats - 1)
                )

        # Create audit log
        audit = AuditLogDB(
            crisis_id=crisis_db.id,
            agent_name="CoordinatorAgent",
            action="CRISIS_ORCHESTRATED",
            details=f"Crisis resolved with solver status {opt_result.status}. Optimal cost calculated: {opt_result.total_cost} EUR.",
            confidence=0.98
        )
        session.add(audit)

        await session.commit()
        return CrisisEvent.model_validate(crisis_db)

    @staticmethod
    async def approve_decisions(session: AsyncSession, crisis_id: int) -> bool:
        # Update all decisions for the crisis to APPROVED
        await session.execute(
            update(DecisionDB)
            .where(DecisionDB.crisis_id == crisis_id)
            .values(status=DecisionStatus.APPROVED, updated_at=datetime.utcnow())
        )

        # Update crisis status to RESOLVED
        await session.execute(
            update(CrisisDB)
            .where(CrisisDB.id == crisis_id)
            .values(status=CrisisStatus.RESOLVED, resolved_at=datetime.utcnow())
        )

        # Log audit
        audit = AuditLogDB(
            crisis_id=crisis_id,
            agent_name="OpsManager",
            action="CRISIS_APPROVED",
            details="Human-in-the-Loop: Operational manager approved all recovery decisions.",
            confidence=1.0
        )
        session.add(audit)
        await session.commit()
        return True

    @staticmethod
    async def process_crisis(session: AsyncSession, crisis_id: int) -> None:
        """Reprocess decisions for a crisis: clears old decisions and reruns the solver/agents."""
        from sqlalchemy import delete

        # 1. Fetch the crisis
        result = await session.execute(select(CrisisDB).where(CrisisDB.id == crisis_id))
        crisis_db = result.scalars().first()
        if not crisis_db:
            raise ValueError(f"Crisis {crisis_id} not found.")

        # 2. Find the flight
        flight_result = await session.execute(select(FlightDB).where(FlightDB.id == crisis_db.affected_flight_id))
        affected_flight = flight_result.scalars().first()
        if not affected_flight:
            raise ValueError(f"Flight for crisis {crisis_id} not found.")

        # 3. Query all passengers booked on this flight
        pax_result = await session.execute(select(PassengerDB))
        all_passengers = pax_result.scalars().all()
        affected_pax = []
        if affected_flight.flight_number == "TK1981":
            affected_pax = all_passengers[:25]
        elif affected_flight.flight_number == "TK1821":
            affected_pax = all_passengers[25:50]
        else:
            affected_pax = all_passengers[:10]

        # Delete existing decisions and audit logs for this crisis
        await session.execute(delete(DecisionDB).where(DecisionDB.crisis_id == crisis_id))
        await session.execute(delete(AuditLogDB).where(AuditLogDB.crisis_id == crisis_id))

        # 4. Find alternative recovery flights
        alt_flights_result = await session.execute(
            select(FlightDB).where(
                FlightDB.origin == affected_flight.origin,
                FlightDB.destination == affected_flight.destination,
                FlightDB.status == FlightStatus.SCHEDULED,
                FlightDB.flight_number != affected_flight.flight_number
            )
        )
        alt_flights = alt_flights_result.scalars().all()

        pax_models = [Passenger.model_validate(p) for p in affected_pax]
        alt_flight_models = [Flight.model_validate(f) for f in alt_flights]

        rebooking_costs = {}
        flight_capacities = {}
        compensation_map = {}
        for f in alt_flights:
            flight_capacities[f.id] = f.available_seats

        calculator = EU261Calculator()
        for p in pax_models:
            rebooking_costs[p.id] = {}
            delay = 6.0 if crisis_db.crisis_type == CrisisType.CANCELLATION else 3.5
            comp = calculator.calculate_compensation(p.id, affected_flight.distance_km, delay)
            compensation_map[p.id] = comp.amount_eur
            for f in alt_flight_models:
                base_delay_cost = (f.scheduled_departure - affected_flight.scheduled_departure).total_seconds() / 3600.0 * 50.0
                loyalty_penalty = 0.0
                if p.ticket_class == TicketClass.FIRST and f.aircraft_type == "Airbus A321neo":
                    loyalty_penalty = 1000.0
                rebooking_costs[p.id][f.id] = base_delay_cost + comp.amount_eur + loyalty_penalty

        solver_input = OptimizationInput(
            passengers=pax_models,
            alternative_flights=alt_flight_models,
            rebooking_costs=rebooking_costs,
            flight_capacities=flight_capacities
        )
        solver = CrisisSolver(solver_input)
        opt_result = solver.solve()

        coordinator = CrisisCoordinator()
        flights_map = {f.id: f for f in alt_flight_models}
        decisions = await coordinator.process_passenger_decisions(
            crisis_id=crisis_db.id,
            passengers=pax_models,
            flights_map=flights_map,
            assignments=opt_result.assignments,
            compensation_map=compensation_map,
            reason=crisis_db.reason
        )

        for dec in decisions:
            dec_db = DecisionDB(
                crisis_id=dec.crisis_id,
                passenger_id=dec.passenger_id,
                action=dec.action,
                new_flight_id=dec.new_flight_id,
                compensation_amount_eur=dec.compensation_amount_eur,
                hotel_name=dec.hotel_name,
                status=DecisionStatus.PENDING,
                agent_confidence=dec.agent_confidence,
                agent_reasoning=dec.agent_reasoning
            )
            session.add(dec_db)
            if dec.new_flight_id:
                await session.execute(
                    update(FlightDB)
                    .where(FlightDB.id == dec.new_flight_id)
                    .values(available_seats=FlightDB.available_seats - 1)
                )

        audit = AuditLogDB(
            crisis_id=crisis_db.id,
            agent_name="CoordinatorAgent",
            action="CRISIS_REPROCESSED",
            details=f"Crisis reprocessed with solver status {opt_result.status}.",
            confidence=0.98
        )
        session.add(audit)
        await session.commit()

