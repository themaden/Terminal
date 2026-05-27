"""Objective function builder for the MILP problem."""

from __future__ import annotations

from pulp import LpProblem, LpVariable, lpSum

from app.optimization.models import FlightOption, OptimizationInput, PassengerInput


def build_cost_minimisation_objective(
    problem: LpProblem,
    x: dict[str, dict[str, LpVariable]],
    y_hotel: dict[str, LpVariable],
    y_meal: dict[str, LpVariable],
    opt_input: OptimizationInput,
) -> None:
    """Minimise total recovery cost:

        min ∑_p ∑_f  rebooking_cost[f] · x[p][f]
          + ∑_p  compensation[p]
          + ∑_p  hotel_cost · y_hotel[p]
          + ∑_p  meal_cost  · y_meal[p]

    Where higher-priority passengers have a *lower* effective cost so the
    solver prefers assigning them first (via a negative priority offset).
    """
    terms = []
    for pax in opt_input.passengers:
        pid = str(pax.id)
        priority_discount = pax.priority_weight * 10.0  # scale factor

        # Rebooking cost per flight assignment
        for flight in opt_input.available_flights:
            fid = str(flight.id)
            if fid in x.get(pid, {}):
                effective_cost = flight.rebooking_cost_eur - priority_discount
                terms.append(effective_cost * x[pid][fid])

        # Hotel and meal costs
        if pid in y_hotel:
            terms.append(opt_input.hotel_cost_eur * y_hotel[pid])
        if pid in y_meal:
            terms.append(opt_input.meal_cost_eur * y_meal[pid])

    problem += lpSum(terms), "total_recovery_cost"
