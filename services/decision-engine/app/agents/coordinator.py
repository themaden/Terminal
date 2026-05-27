import httpx
from typing import Dict, List, Any, Optional
from app.config import settings
from app.models.passenger import Passenger
from app.models.flight import Flight
from app.models.decision import Decision, DecisionAction, DecisionStatus
from app.agents.prompts import (
    REBOOKING_AGENT_PROMPT,
    COMPENSATION_AGENT_PROMPT,
    COMMUNICATION_AGENT_PROMPT,
    COMPLIANCE_AGENT_PROMPT
)

class CrisisCoordinator:
    """
    Orchestrates the Multi-Agent AI system to generate passenger decisions and messages
    based on optimization results.
    """

    def __init__(self, openai_api_key: Optional[str] = None):
        self.api_key = openai_api_key or settings.OPENAI_API_KEY
        self.client = httpx.AsyncClient(timeout=30.0)

    async def _call_llm(self, system_prompt: str, user_prompt: str) -> str:
        if not self.api_key:
            # Fallback mock LLM response when OpenAI API Key is missing
            return f"[MOCK AI RESPONSE] Processed successfully based on rules."

        try:
            response = await self.client.post(
                "https://api.openai.com/v1/chat/completypes",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": settings.LLM_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": settings.LLM_TEMPERATURE
                }
            )
            if response.status_code == 200:
                data = response.json()
                return data["choices"][0]["message"]["content"]
            else:
                return f"[LLM ERROR] Status {response.status_code}: {response.text}"
        except Exception as e:
            return f"[LLM EXCEPTION] {str(e)}"

    async def process_passenger_decisions(
        self,
        crisis_id: int,
        passengers: List[Passenger],
        flights_map: Dict[int, Flight],
        assignments: Dict[int, Optional[int]],
        compensation_map: Dict[int, float],
        reason: str
    ) -> List[Decision]:
        
        decisions = []
        
        for p in passengers:
            p_id = p.id
            assigned_f_id = assignments.get(p_id)
            comp_amount = compensation_map.get(p_id, 0.0)
            
            # Determine Action
            action = DecisionAction.NO_ACTION
            hotel_name = None
            
            if assigned_f_id is not None:
                action = DecisionAction.REBOOK
                assigned_flight = flights_map.get(assigned_f_id)
                # If delay is overnight, assign hotel
                if assigned_flight:
                    # Let's say delay of > 8 hours or overnight triggers hotel
                    action = DecisionAction.REBOOK
                    if assigned_flight.scheduled_departure.day != datetime_now_day():
                        hotel_name = "Aviation Airport Hotel (4-Star)" if p.ticket_class == "ECONOMY" else "Radisson Blu Airport Hotel (5-Star)"
            else:
                # No flight assigned -> Refund
                action = DecisionAction.REFUND

            # Run Multi-Agent validation & text generation
            # Step 1: Rebooking Agent
            rebook_prompt = f"Passenger class: {p.ticket_class}, Loyalty: {p.loyalty_tier}. Assigned flight ID: {assigned_f_id}. Reason: {reason}."
            rebook_notes = await self._call_llm(REBOOKING_AGENT_PROMPT, rebook_prompt)
            
            # Step 2: Compensation Agent
            comp_prompt = f"Passenger ID: {p_id}. Calculated EU261 compensation: {comp_amount} EUR. Distance: 2500 km. Delay hours: 6."
            comp_notes = await self._call_llm(COMPENSATION_AGENT_PROMPT, comp_prompt)
            
            # Step 3: Communication Agent (generates messages)
            comm_prompt = f"Passenger Name: {p.first_name} {p.last_name}, Language preference: Turkish & English. Action: {action.value}. New flight: {assigned_f_id}. Hotel: {hotel_name}. Comp: {comp_amount} EUR."
            comm_text = await self._call_llm(COMMUNICATION_AGENT_PROMPT, comm_prompt)
            
            # Step 4: Compliance Agent Audit
            compliance_prompt = f"Action: {action.value}, Hotel: {hotel_name}, Compensation: {comp_amount}. Rebook notes: {rebook_notes}."
            compliance_audit = await self._call_llm(COMPLIANCE_AGENT_PROMPT, compliance_prompt)

            # Store the consolidated decision
            dec = Decision(
                crisis_id=crisis_id,
                passenger_id=p_id,
                action=action,
                new_flight_id=assigned_f_id,
                compensation_amount_eur=comp_amount,
                hotel_name=hotel_name,
                status=DecisionStatus.PENDING,
                agent_confidence=0.95,
                agent_reasoning=f"Rebook Validation: {rebook_notes[:200]}...\nCompliance: {compliance_audit[:100]}...\nMessage: {comm_text[:300]}"
            )
            decisions.append(dec)

        return decisions

def datetime_now_day() -> int:
    from datetime import datetime
    return datetime.utcnow().day
