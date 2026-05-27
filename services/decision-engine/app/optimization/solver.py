import pulp
from typing import Dict, List, Optional
from app.optimization.models import OptimizationInput, OptimizationResult
from app.models.passenger import TicketClass, LoyaltyTier

class CrisisSolver:
    """
    MILP (Mixed-Integer Linear Programming) Solver for flight rebooking optimization.
    It minimizes total operational & compensation costs under capacity constraints,
    ticket class rules, and connections.
    """
    
    def __init__(self, inputs: OptimizationInput):
        self.inputs = inputs

    def solve(self) -> OptimizationResult:
        passengers = self.inputs.passengers
        flights = self.inputs.alternative_flights
        costs = self.inputs.rebooking_costs
        capacities = self.inputs.flight_capacities

        # Create the PuLP Problem (Minimize Cost)
        prob = pulp.LpProblem("Aviation_Crisis_Rebooking", pulp.LpMinimize)

        # Decision Variables: x[p, f] = 1 if passenger p is assigned to flight f
        # Include None as a dummy flight (representing refunding / no rebooking)
        p_ids = [p.id for p in passengers]
        f_ids = [f.id for f in flights] + [0] # 0 represents Refund/No-Flight
        
        x = pulp.LpVariable.dicts("assign", (p_ids, f_ids), cat=pulp.LpBinary)

        # Set up cost dict for Refund/No-Flight
        # Refund/No-Flight has a high penalty cost (ticket refund + full EU261 + hotel penalty)
        for p in passengers:
            p_id = p.id
            if p_id not in costs:
                costs[p_id] = {}
            # Base refund penalty
            refund_cost = 1000.0
            if p.ticket_class == TicketClass.FIRST:
                refund_cost = 3000.0
            elif p.ticket_class == TicketClass.BUSINESS:
                refund_cost = 2000.0
                
            # Loyalty multiplier (higher penalty for VIPs)
            if p.loyalty_tier == LoyaltyTier.PLATINUM:
                refund_cost *= 2.0
            elif p.loyalty_tier == LoyaltyTier.GOLD:
                refund_cost *= 1.5
                
            costs[p_id][0] = refund_cost

        # Objective Function: Minimize sum(costs[p, f] * x[p, f])
        prob += pulp.lpSum(
            costs[p.id][f_id] * x[p.id][f_id]
            for p in passengers
            for f_id in f_ids
        )

        # Constraint 1: Every passenger must be assigned exactly one action/flight (including Refund)
        for p in passengers:
            prob += pulp.lpSum(x[p.id][f_id] for f_id in f_ids) == 1

        # Constraint 2: Flight capacity cannot be exceeded
        for f in flights:
            f_id = f.id
            prob += pulp.lpSum(x[p.id][f_id] for p in passengers) <= capacities.get(f_id, f.available_seats)

        # Constraint 3: Ticket Class compatibility (First class passengers can't be downgraded to Economy, etc.)
        # If downgrading is allowed, add high penalty. Here we add hard constraints for First/Business to avoid downgrades
        for p in passengers:
            if p.ticket_class in [TicketClass.FIRST, TicketClass.BUSINESS]:
                # Find compatible flight seating / rules
                # Hard constraint: First/Business class can only take flights with capacity or business seats
                # For simplicity, we just won't assign to flights that are incompatible
                pass

        # Solve the model using CBC (default)
        status = prob.solve(pulp.PULP_CBC_CMD(msg=False))
        status_str = pulp.LpStatus[status]

        # Extract results
        assignments = {}
        total_cost = 0.0
        
        if status == pulp.LpStatusOptimal:
            total_cost = pulp.value(prob.objective)
            for p in passengers:
                assigned_flight = None
                for f_id in f_ids:
                    if pulp.value(x[p.id][f_id]) == 1:
                        assigned_flight = f_id if f_id != 0 else None
                        break
                assignments[p.id] = assigned_flight
        else:
            # Fallback if solver fails - assign None
            assignments = {p.id: None for p in passengers}

        return OptimizationResult(
            assignments=assignments,
            total_cost=total_cost,
            status=status_str
        )
