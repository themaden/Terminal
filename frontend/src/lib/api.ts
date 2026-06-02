/**
 * api.ts — Centralized API client for JetNexus AI Decision Engine.
 *
 * All fetch calls go through this module so we have a single place to:
 *  - Set the base URL from env
 *  - Handle errors uniformly
 *  - Add auth headers if needed in the future
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Generic fetch helper ─────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let message = `API error ${res.status}`;
    try {
      const body = await res.json();
      message = body?.detail ?? message;
    } catch {}
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CrisisEvent {
  id: number;
  crisis_type: string;
  affected_flight_id: number;
  reason: string;
  severity: string;
  status: string;
  affected_passenger_count: number;
  triggered_at: string;
  resolved_at?: string;
}

export interface Decision {
  id: number;
  crisis_id: number;
  passenger_id: number;
  action: string;
  new_flight_id?: number;
  compensation_amount_eur: number;
  hotel_name?: string;
  status: string;
  agent_confidence: number;
  agent_reasoning: string;
  created_at: string;
}

export interface Flight {
  id: number;
  flight_number: string;
  origin: string;
  destination: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  status: string;
  aircraft_type: string;
  total_capacity: number;
  available_seats: number;
  distance_km: number;
}

export interface Passenger {
  id: number;
  pnr: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  ticket_class: string;
  loyalty_tier: string;
  special_needs?: string;
  booking_reference: string;
}

export interface Stats {
  crises: { total: number; active: number; resolved: number };
  passengers: number;
  flights: number;
  decisions: number;
  total_compensation_eur: number;
}

export interface AuditLog {
  id: number;
  agent: string;
  action: string;
  details: string;
  confidence: number;
  timestamp: string;
}

// ─── Crisis API ───────────────────────────────────────────────────────────────

export const crisisApi = {
  listAll: (skip = 0, limit = 50) =>
    apiFetch<CrisisEvent[]>(`/api/v1/crisis?skip=${skip}&limit=${limit}`),

  listActive: () =>
    apiFetch<CrisisEvent[]>("/api/v1/crisis/active"),

  getById: (id: number) =>
    apiFetch<CrisisEvent>(`/api/v1/crisis/${id}`),

  trigger: (params: {
    flight_number: string;
    crisis_type: string;
    reason: string;
    severity?: string;
  }) => {
    const qs = new URLSearchParams({
      flight_number: params.flight_number,
      crisis_type: params.crisis_type,
      reason: params.reason,
      ...(params.severity ? { severity: params.severity } : {}),
    });
    return apiFetch<CrisisEvent>(`/api/v1/crisis/trigger?${qs}`, { method: "POST" });
  },

  approve: (crisisId: number) =>
    apiFetch<{ message: string; crisis_id: number }>(
      `/api/v1/crisis/${crisisId}/approve`,
      { method: "POST" }
    ),

  getDecisions: (crisisId: number) =>
    apiFetch<Decision[]>(`/api/v1/crisis/${crisisId}/decisions`),

  getAudit: (crisisId: number) =>
    apiFetch<AuditLog[]>(`/api/v1/crisis/${crisisId}/audit`),
};

// ─── Flights API ──────────────────────────────────────────────────────────────

export const flightsApi = {
  listAll: (origin?: string, destination?: string) => {
    const qs = new URLSearchParams();
    if (origin) qs.set("origin", origin);
    if (destination) qs.set("destination", destination);
    return apiFetch<Flight[]>(`/api/v1/flights?${qs}`);
  },

  getById: (id: number) =>
    apiFetch<Flight>(`/api/v1/flights/${id}`),
};

// ─── Passengers API ───────────────────────────────────────────────────────────

export const passengersApi = {
  listAll: (skip = 0, limit = 100) =>
    apiFetch<Passenger[]>(`/api/v1/passengers?skip=${skip}&limit=${limit}`),

  getById: (id: number) =>
    apiFetch<Passenger>(`/api/v1/passengers/${id}`),
};

// ─── Stats API ────────────────────────────────────────────────────────────────

export const statsApi = {
  get: () => apiFetch<Stats>("/api/v1/stats"),
};

// ─── Health API ───────────────────────────────────────────────────────────────

export const healthApi = {
  check: () => apiFetch<{ status: string }>("/health"),
  ready: () => apiFetch<{ ready: boolean }>("/health/ready"),
};
