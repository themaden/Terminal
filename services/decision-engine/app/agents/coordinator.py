from datetime import UTC, datetime

import httpx

from app.agents.prompts import (
    COMMUNICATION_AGENT_PROMPT,
    COMPENSATION_AGENT_PROMPT,
    COMPLIANCE_AGENT_PROMPT,
    REBOOKING_AGENT_PROMPT,
)
from app.config import settings
from app.models.decision import Decision, DecisionAction, DecisionStatus
from app.models.flight import Flight
from app.models.passenger import Passenger


class CrisisCoordinator:
    """
    Orchestrates the Multi-Agent AI system to generate passenger decisions and messages
    based on optimization results.
    """

    def __init__(self, openai_api_key: str | None = None):
        self.api_key = openai_api_key or settings.OPENAI_API_KEY
        self.client = httpx.AsyncClient(timeout=60.0)

    async def _call_llm(self, system_prompt: str, user_prompt: str) -> str:
        """
        LLM çağrısı — öncelik zinciri:
          1. OpenAI GPT-4o  (OPENAI_API_KEY varsa)
          2. Ollama Llama 3.2  (yerel, ücretsiz — Ollama kuruluysa)
          3. Kural tabanlı mock yanıt  (her ikisi de yoksa)
        """
        # ── 1. OpenAI ───────────────────────────────────────────────────────
        if settings.openai_configured:
            try:
                response = await self.client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                    json={
                        "model": settings.LLM_MODEL,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ],
                        "temperature": settings.LLM_TEMPERATURE,
                        "max_tokens": settings.LLM_MAX_TOKENS,
                    },
                )
                if response.status_code == 200:
                    return response.json()["choices"][0]["message"]["content"]
            except Exception:
                pass  # OpenAI başarısız → Ollama'ya düş

        # ── 2. Ollama / Llama 3.2 ────────────────────────────────────────────
        try:
            response = await self.client.post(
                f"{settings.OLLAMA_BASE_URL}/api/chat",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "stream": False,
                },
                timeout=30.0,
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("message", {}).get("content", "")
        except Exception:
            pass  # Ollama da yok → kural tabanlı

        # ── 3. Kural tabanlı fallback ─────────────────────────────────────────
        return (
            "[KURAL TABANLI KARAR] OpenAI ve Ollama yapılandırılmamış. "
            "IATA standartları ve EU261 düzenlemesine göre otomatik karar uygulandı."
        )

    async def process_passenger_decisions(
        self,
        crisis_id: int,
        passengers: list[Passenger],
        flights_map: dict[int, Flight],
        assignments: dict[int, int | None],
        compensation_map: dict[int, float],
        reason: str
    ) -> list[Decision]:

        decisions = []
        today_utc = datetime.now(UTC).date()

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
                if assigned_flight:
                    # Hotel required if the alternative flight departs on a different calendar day (UTC)
                    flight_date = assigned_flight.scheduled_departure.date()
                    if flight_date != today_utc:
                        ticket_class_val = p.ticket_class.value if hasattr(p.ticket_class, 'value') else str(p.ticket_class)
                        if ticket_class_val in ("ECONOMY",):
                            hotel_name = "Aviation Airport Hotel (4-Star)"
                        else:
                            hotel_name = "Radisson Blu Airport Hotel (5-Star)"
            else:
                # No flight assigned -> Refund
                action = DecisionAction.REFUND

            # Run Multi-Agent validation & text generation
            # Step 1: Rebooking Agent
            rebook_prompt = f"Passenger class: {p.ticket_class}, Loyalty: {p.loyalty_tier}. Assigned flight ID: {assigned_f_id}. Reason: {reason}."
            rebook_notes = await self._call_llm(REBOOKING_AGENT_PROMPT, rebook_prompt)

            # Step 2: Compensation Agent
            comp_prompt = f"Passenger ID: {p_id}. Calculated EU261 compensation: {comp_amount} EUR. Reason: {reason}. Action: {action.value}."
            await self._call_llm(COMPENSATION_AGENT_PROMPT, comp_prompt)

            # Step 3: Communication Agent (generates passenger messages in TR & EN)
            ticket_class_str = p.ticket_class.value if hasattr(p.ticket_class, 'value') else str(p.ticket_class)
            comm_prompt = (
                f"Passenger Name: {p.first_name} {p.last_name}, "
                f"Class: {ticket_class_str}, Language: Turkish & English. "
                f"Action: {action.value}. New flight: {assigned_f_id}. "
                f"Hotel: {hotel_name}. Compensation: {comp_amount} EUR. Reason: {reason}."
            )
            comm_text = await self._call_llm(COMMUNICATION_AGENT_PROMPT, comm_prompt)

            # Step 4: Compliance Agent Audit
            compliance_prompt = (
                f"Action: {action.value}, Hotel: {hotel_name}, "
                f"Compensation: {comp_amount} EUR. Rebooking notes: {rebook_notes[:300]}."
            )
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
                agent_reasoning=(
                    f"Rebook: {rebook_notes[:200]}\n"
                    f"Compliance: {compliance_audit[:150]}\n"
                    f"Message: {comm_text[:300]}"
                )
            )
            decisions.append(dec)

        return decisions
