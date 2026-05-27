"""Constraint builders for the MILP problem."""

from __future__ import annotations

from pulp import LpProblem, LpVariable, lpSum

from app.optimization.models import FlightOption, PassengerInput


def add_capacity_constraints(
    problem: LpProblem,
    x: dict[str, dict[str, LpVariable]],
    passengers: list[PassengerInput],
    flights: list[FlightOption],
) -> None:
    """Each flight must not exceed its available-seat capacity.

    ∑_p x[p][f] ≤ available_seats[f]   ∀ f ∈ flights
    """
    for flight in flights:
        fid = str(flight.id)
        problem += (
            lpSum(x[str(p.id)][fid] for p in passengers if fid in x.get(str(p.id), {}))
            <= flight.available_seats,
            f"capacity_{fid}",
        )


def add_single_assignment_constraints(
    problem: LpProblem,
    x: dict[str, dict[str, LpVariable]],
    passengers: list[PassengerInput],
    flights: list[FlightOption],
) -> None:
    """Each passenger is assigned to at most one flight.

    ∑_f x[p][f] ≤ 1   ∀ p ∈ passengers
    """
    for pax in passengers:
        pid = str(pax.id)
        problem += (
            lpSum(x[pid][str(f.id)] for f in flights if str(f.id) in x.get(pid, {}))
            <= 1,
            f"single_assign_{pid}",
        )


def add_class_compatibility_constraints(
    problem: LpProblem,
    x: dict[str, dict[str, LpVariable]],
    passengers: list[PassengerInput],
    flights: list[FlightOption],
) -> None:
    """A passenger cannot be assigned to a flight that does not offer their cabin class.

    If the passenger's ticket class is not in the flight's available classes,
    force x[p][f] = 0.

    Exception: upgrades are allowed (ECONOMY → BUSINESS/FIRST, BUSINESS → FIRST).
    """
    class_rank = {"ECONOMY": 0, "BUSINESS": 1, "FIRST": 2}

    for pax in passengers:
        pid = str(pax.id)
        pax_rank = class_rank.get(pax.ticket_class, 0)
        for flight in flights:
            fid = str(flight.id)
            if fid not in x.get(pid, {}):
                continue
            # The best available class on the flight
            best_available = max(
                (class_rank.get(c, 0) for c in flight.ticket_classes_available),
                default=0,
            )
            if best_available < pax_rank:
                # Flight cannot serve this class at all (no upgrade path)
                problem += (x[pid][fid] == 0, f"class_compat_{pid}_{fid}")


def add_connection_time_constraints(
    problem: LpProblem,
    x: dict[str, dict[str, LpVariable]],
    passengers: list[PassengerInput],
    flights: list[FlightOption],
    min_connection_minutes: int = 60,
) -> None:
    """Placeholder for minimum connection-time constraints.

    In a production system this would compare the arrival time of the
    original flight vs. the departure time of the new flight and disallow
    assignments that are too close together.  For now we accept all
    assignments – this can be extended when itinerary data is available.
    """
    # Currently a no-op; included to show the extensible constraint architecture.
    pass
