
import pulp
from collections import defaultdict

from app.models.passenger import LoyaltyTier, TicketClass
from app.optimization.models import OptimizationInput, OptimizationResult


class CrisisSolver:
    """
    MILP Solver — doküman §3 4-derece öncelik hiyerarşisi ile:
      1. Derece: UM / engelli → ilk müsait uçuşa hard constraint ile ata
      2. Derece: Elite/Platinum → kendi uçuşu yoksa refund penalty çok yüksek
      3. Derece: Aile/grup → group_id eşleşenleri aynı uçuşa zorla (bölünme yasağı)
      4. Derece: Standart → maliyet minimizasyonu
    """

    def __init__(self, inputs: OptimizationInput):
        self.inputs = inputs

    def solve(self) -> OptimizationResult:
        passengers = self.inputs.passengers
        flights = self.inputs.alternative_flights
        costs = self.inputs.rebooking_costs
        capacities = self.inputs.flight_capacities

        prob = pulp.LpProblem("Aviation_Crisis_Rebooking", pulp.LpMinimize)

        p_ids = [p.id for p in passengers]
        f_ids = [f.id for f in flights] + [0]  # 0 = refund/no-flight

        x = pulp.LpVariable.dicts("assign", (p_ids, f_ids), cat=pulp.LpBinary)

        # Refund/no-flight penalty (derece'ye göre ölçeklenir)
        for p in passengers:
            p_id = p.id
            if p_id not in costs:
                costs[p_id] = {}

            base = 1000.0
            if p.ticket_class == TicketClass.FIRST:
                base = 3000.0
            elif p.ticket_class == TicketClass.BUSINESS:
                base = 2000.0

            # 2. Derece: Platinum/Gold → refund çok pahalı, partner arama zorlaması
            if p.loyalty_tier == LoyaltyTier.PLATINUM:
                base *= 4.0
            elif p.loyalty_tier == LoyaltyTier.GOLD:
                base *= 2.5
            elif p.loyalty_tier == LoyaltyTier.SILVER:
                base *= 1.5

            # 1. Derece: UM/engelli → refund neredeyse yasak (çok yüksek ceza)
            if p.is_unaccompanied_minor or p.is_disabled:
                base *= 10.0

            costs[p_id][0] = base

        # Amaç fonksiyonu
        prob += pulp.lpSum(
            costs[p.id][f_id] * x[p.id][f_id]
            for p in passengers
            for f_id in f_ids
        )

        # Kısıt 1: Her yolcuya tam olarak 1 aksiyon
        for p in passengers:
            prob += pulp.lpSum(x[p.id][f_id] for f_id in f_ids) == 1

        # Kısıt 2: Kapasite aşılamaz
        for f in flights:
            prob += pulp.lpSum(x[p.id][f.id] for p in passengers) <= capacities.get(f.id, f.available_seats)

        # Kısıt 3 — 1. Derece: UM ve engelli refund'a atanamamaz (uçuş yoksa da onay gerekir)
        for p in passengers:
            if p.is_unaccompanied_minor or p.is_disabled:
                if flights:
                    # En erken kalkan uçuşa hard-assign: x[p][first_flight] = 1 gereksinimi
                    # Soft yaklaşım: refund'u tamamen kapat (zaten ceza çok yüksek)
                    # Hard yaklaşım: refund değişkeni 0'a sabitle
                    prob += x[p.id][0] == 0, f"no_refund_priority1_{p.id}"

        # Kısıt 4 — 3. Derece: Aile bütünlüğü (group_id eşleşen yolcular aynı uçuşa)
        groups: dict[str, list] = defaultdict(list)
        for p in passengers:
            if p.group_id:
                groups[p.group_id].append(p)

        for gid, members in groups.items():
            if len(members) < 2:
                continue
            # Her uçuş için: tüm grup üyeleri aynı uçuşta ya da hiçbiri değil
            for f in flights:
                # Birinci üye ile diğerleri arasında eşitlik kısıtı
                p0 = members[0]
                for pm in members[1:]:
                    prob += x[p0.id][f.id] == x[pm.id][f.id], f"family_{gid}_{f.id}_{pm.id}"

        # Kısıt 5: Bilet sınıfı uyumu (First/Business downgrade penalty)
        for p in passengers:
            if p.ticket_class in (TicketClass.FIRST, TicketClass.BUSINESS):
                penalty = 2000 if p.ticket_class == TicketClass.FIRST else 1000
                for f_id in [f.id for f in flights]:
                    if f_id in costs.get(p.id, {}):
                        costs[p.id][f_id] += penalty * 0.1  # penalty katkısı (soft)

        status = prob.solve(pulp.PULP_CBC_CMD(msg=False))
        status_str = pulp.LpStatus[status]

        assignments = {}
        total_cost = 0.0

        if status == pulp.LpStatusOptimal:
            total_cost = pulp.value(prob.objective) or 0.0
            for p in passengers:
                assigned = None
                for f_id in f_ids:
                    val = pulp.value(x[p.id][f_id])
                    if val is not None and round(val) == 1:
                        assigned = f_id if f_id != 0 else None
                        break
                assignments[p.id] = assigned
        else:
            import logging
            logging.warning("MILP solver failed: %s", status_str)
            assignments = {p.id: None for p in passengers}

        return OptimizationResult(
            assignments=assignments,
            total_cost=total_cost,
            status=status_str,
        )
