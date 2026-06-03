/**
 * api.ts — JetNexus AI centralized API client.
 * Single source of truth for all backend requests.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('jetnexus_token');
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });
  if (res.status === 401) {
    localStorage.removeItem('jetnexus_token');
    localStorage.removeItem('jetnexus_user');
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Oturum süresi doldu');
  }
  if (!res.ok) {
    let message = `API error ${res.status}`;
    try { const b = await res.json(); message = b?.detail ?? message; } catch {}
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
  crisis_id?: number;
}

// IOCC
export interface ActiveCrisis {
  crisis_id: number;
  crisis_type: string;
  severity: string;
  flight_number: string;
  origin: string;
  destination: string;
  affected_passengers: number;
  triggered_at: string;
  reason: string;
}

export interface IOCCDashboard {
  active_crises: ActiveCrisis[];
  active_crisis_count: number;
  pending_approvals: number;
  total_affected_passengers: number;
  act_tracker: { total: number; ok: number; at_risk: number; critical: number; missed: number };
}

export interface SimResult {
  simulation: boolean;
  flight_number: string;
  disruption_type: string;
  delay_minutes: number;
  estimated_affected_passengers: number;
  estimated_eu261_cost_eur: number;
  sample_recommendations: {
    pnr: string;
    action: string;
    priority_score: number;
    compensation_eur: number;
    compliance_flags: string[];
    reasoning: string;
  }[];
}

// Hub Control
export interface ConnectionRecord {
  pnr: string;
  inbound_flight: string;
  outbound_flight: string;
  hub_airport: string;
  inbound_eta: string;
  outbound_std: string;
  act_minutes: number;
  mct_minutes: number;
  status: 'OK' | 'AT_RISK' | 'CRITICAL' | 'MISSED';
  last_updated: string;
}

export interface ConnectionSummary {
  total: number;
  ok: number;
  at_risk: number;
  critical: number;
  missed: number;
}

// PCC
export interface AtRiskPassenger {
  passenger_id: number;
  pnr: string;
  name: string;
  ticket_class: string;
  loyalty_tier: string;
  special_needs: string | null;
  flight_number: string;
  origin: string;
  destination: string;
  crisis_type: string;
  crisis_severity: string;
  recommended_action: string;
  compensation_eur: number;
  hotel: string | null;
  decision_status: string;
  agent_confidence: number;
}

export interface PCCSummary {
  pending_decisions: number;
  executed_decisions: number;
  total_compensation_paid_eur: number;
  active_crises: number;
}

// Revenue
export interface ImpactSummary {
  compensation: {
    paid_eur: number;
    pending_eur: number;
    total_eur: number;
    average_per_passenger_eur: number;
  };
  crises: { total: number; active: number; resolved: number };
  decisions: { rebooked_passengers: number; hotel_accommodations: number };
}

export interface CrisisImpact {
  crisis_id: number;
  crisis_type: string;
  severity: string;
  status: string;
  triggered_at: string;
  flight_number: string;
  route: string;
  affected_passengers: number;
  total_compensation_eur: number;
  decision_count: number;
  avg_compensation_eur: number;
}

export interface ClassBreakdown {
  ticket_class: string;
  affected_count: number;
  total_compensation_eur: number;
  avg_compensation_eur: number;
}

export interface Efficiency {
  total_decisions: number;
  executed: number;
  pending: number;
  rejected: number;
  automation_rate_pct: number;
  avg_agent_confidence: number;
}

// ─── API Modules ──────────────────────────────────────────────────────────────

export const healthApi = {
  check: () => apiFetch<{ status: string }>('/health'),
  ready: () => apiFetch<{ ready: boolean }>('/health/ready'),
};

export const statsApi = {
  get: () => apiFetch<Stats>('/api/v1/stats'),
};

export const crisisApi = {
  listAll: (skip = 0, limit = 50) =>
    apiFetch<CrisisEvent[]>(`/api/v1/crisis?skip=${skip}&limit=${limit}`),
  listActive: () => apiFetch<CrisisEvent[]>('/api/v1/crisis/active'),
  getById: (id: number) => apiFetch<CrisisEvent>(`/api/v1/crisis/${id}`),
  trigger: (params: { flight_number: string; crisis_type: string; reason: string; severity?: string }) => {
    const qs = new URLSearchParams({
      flight_number: params.flight_number,
      crisis_type: params.crisis_type,
      reason: params.reason,
      ...(params.severity ? { severity: params.severity } : {}),
    });
    return apiFetch<CrisisEvent>(`/api/v1/crisis/trigger?${qs}`, { method: 'POST' });
  },
  approve: (crisisId: number) =>
    apiFetch<{ message: string; crisis_id: number }>(`/api/v1/crisis/${crisisId}/approve`, { method: 'POST' }),
  getDecisions: (crisisId: number) => apiFetch<Decision[]>(`/api/v1/crisis/${crisisId}/decisions`),
  getAudit: (crisisId: number) => apiFetch<AuditLog[]>(`/api/v1/crisis/${crisisId}/audit`),
};

export const flightsApi = {
  listAll: (origin?: string, destination?: string) => {
    const qs = new URLSearchParams();
    if (origin) qs.set('origin', origin);
    if (destination) qs.set('destination', destination);
    return apiFetch<Flight[]>(`/api/v1/flights?${qs}`);
  },
  getById: (id: number) => apiFetch<Flight>(`/api/v1/flights/${id}`),
};

export const passengersApi = {
  listAll: (skip = 0, limit = 100) =>
    apiFetch<Passenger[]>(`/api/v1/passengers?skip=${skip}&limit=${limit}`),
  getById: (id: number) => apiFetch<Passenger>(`/api/v1/passengers/${id}`),
};

export const auditApi = {
  listAll: (skip = 0, limit = 100) =>
    apiFetch<AuditLog[]>(`/api/v1/audit?skip=${skip}&limit=${limit}`),
  recent: (limit = 20) =>
    apiFetch<AuditLog[]>(`/api/v1/iocc/audit/recent?limit=${limit}`),
};

export const ioccApi = {
  dashboard: () => apiFetch<IOCCDashboard>('/api/v1/iocc/dashboard'),
  auditRecent: (limit = 15) => apiFetch<AuditLog[]>(`/api/v1/iocc/audit/recent?limit=${limit}`),
  approveAll: (crisisId: number) =>
    apiFetch<{ message: string }>(`/api/v1/iocc/crisis/${crisisId}/approve-all`, { method: 'POST' }),
  simulate: (params: { flight_number: string; disruption_type: string; delay_minutes: number }) => {
    const qs = new URLSearchParams({
      flight_number: params.flight_number,
      disruption_type: params.disruption_type,
      delay_minutes: String(params.delay_minutes),
    });
    return apiFetch<SimResult>(`/api/v1/iocc/scenario/simulate?${qs}`, { method: 'POST' });
  },
};

export const hubApi = {
  atRisk: () => apiFetch<{ count: number; connections: ConnectionRecord[] }>('/api/v1/hub/connections/at-risk'),
  missed: () => apiFetch<{ count: number; connections: ConnectionRecord[] }>('/api/v1/hub/connections/missed'),
  summary: () => apiFetch<ConnectionSummary>('/api/v1/hub/connections/summary'),
  activeFlights: () => apiFetch<Flight[]>('/api/v1/hub/flights/active'),
};

export const pccApi = {
  atRisk: (limit = 50) =>
    apiFetch<{ count: number; passengers: AtRiskPassenger[] }>(`/api/v1/pcc/passengers/at-risk?limit=${limit}`),
  summary: () => apiFetch<PCCSummary>('/api/v1/pcc/summary'),
  recover: (pnr: string) =>
    apiFetch<{ message: string }>(`/api/v1/pcc/passengers/${pnr}/recover`, { method: 'POST' }),
};

export const revenueApi = {
  summary: () => apiFetch<ImpactSummary>('/api/v1/revenue/impact/summary'),
  byCrisis: (limit = 15) => apiFetch<CrisisImpact[]>(`/api/v1/revenue/impact/by-crisis?limit=${limit}`),
  byClass: () => apiFetch<ClassBreakdown[]>('/api/v1/revenue/impact/by-class'),
  efficiency: () => apiFetch<Efficiency>('/api/v1/revenue/efficiency'),
};

// ─── Simulation Engine ────────────────────────────────────────────────────────

export interface ScenarioResult {
  scenario_id: number;
  action_plan: string;
  action_label: string;
  affected_passengers: number;
  total_cost_eur: number;
  rebooking_rate_pct: number;
  avg_delay_minutes: number;
  eu261_liability_eur: number;
  hotel_cost_eur: number;
  score: number;
}

export interface SimulationResponse {
  flight_number: string;
  disruption_type: string;
  n_iterations: number;
  best_plan: ScenarioResult;
  scenarios: ScenarioResult[];
  cost_distribution: { min: number; max: number; mean: number; best_plan_cost: number };
  recommendation: string;
  run_at: string;
}

export const simulationApi = {
  run: (params: { flight_number: string; disruption_type: string; delay_minutes: number; n_iterations?: number }) =>
    apiFetch<SimulationResponse>('/api/v1/simulation/run', {
      method: 'POST',
      body: JSON.stringify({ n_iterations: 1000, ...params }),
    }),
  history: () => apiFetch<{ total_runs: number; last_run: string; avg_iterations: number; most_simulated_flight: string }>('/api/v1/simulation/history'),
};

// ─── Proactive Prediction ─────────────────────────────────────────────────────

export interface RiskFactor {
  factor: string;
  impact: string;
  severity: string;
}

export interface FlightRiskScore {
  flight_number: string;
  origin: string;
  destination: string;
  scheduled_departure: string;
  risk_score: number;
  risk_level: string;
  alert_triggered: boolean;
  risk_factors: RiskFactor[];
  recommended_action: string;
  confidence: number;
}

export interface PredictionSummary {
  total_flights_scored: number;
  critical_alerts: number;
  high_risk: number;
  medium_risk: number;
  low_risk: number;
  last_run: string;
  next_run: string;
}

export const predictionApi = {
  riskScores: () => apiFetch<FlightRiskScore[]>('/api/v1/prediction/risk-scores'),
  summary: () => apiFetch<PredictionSummary>('/api/v1/prediction/summary'),
};

// ─── Passenger Self-Service ───────────────────────────────────────────────────

export interface AlternativeFlight {
  flight_id: number;
  flight_number: string;
  origin: string;
  destination: string;
  scheduled_departure: string;
  available_seats: number;
  fare_difference_eur: number;
  is_recommended: boolean;
}

export interface VoucherItem {
  type: string;
  value_eur: number;
  code: string;
  valid_until: string;
  details: string;
}

export interface BoardingPass {
  pnr: string;
  passenger_name: string;
  flight_number: string;
  origin: string;
  destination: string;
  seat: string;
  gate: string;
  boarding_time: string;
  departure_time: string;
  qr_data: string;
}

export interface SelfServiceStatus {
  pnr: string;
  passenger_name: string;
  original_flight: string;
  crisis_active: boolean;
  crisis_type?: string;
  compensation_eur: number;
  alternatives: AlternativeFlight[];
  vouchers: VoucherItem[];
  decision_status: string;
  message: string;
}

export const selfServiceApi = {
  status: (pnr: string) => apiFetch<SelfServiceStatus>(`/api/v1/self-service/${pnr.toUpperCase()}`),
  rebook: (pnr: string, flightId: number) =>
    apiFetch<{ success: boolean; message: string; new_flight: string; departure: string }>(
      `/api/v1/self-service/${pnr.toUpperCase()}/rebook`,
      { method: 'POST', body: JSON.stringify({ flight_id: flightId }) }
    ),
  boardingPass: (pnr: string) => apiFetch<BoardingPass>(`/api/v1/self-service/${pnr.toUpperCase()}/boarding-pass`),
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
  avatar: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<TokenResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => apiFetch<AuthUser>('/api/v1/auth/me'),
  users: () => apiFetch<AuthUser[]>('/api/v1/auth/users'),
};

// ─── PSS / Amadeus ────────────────────────────────────────────────────────────

export interface FlightOffer {
  id: string;
  source: string;
  flight_number: string;
  airline_code: string;
  origin: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  cabin_class: string;
  available_seats: number;
  price_eur: number;
  price_currency: string;
  is_codeshare: boolean;
  stops: number;
}

export interface PssStatus {
  provider: string;
  mode: string;
  configured: boolean;
  sandbox_url: string;
  endpoints: string[];
}

export const pssApi = {
  search: (origin: string, destination: string, date: string, cabin = 'ECONOMY', adults = 1) =>
    apiFetch<{ count: number; offers: FlightOffer[] }>('/api/v1/pss/amadeus/search', {
      method: 'POST',
      body: JSON.stringify({ origin, destination, date, cabin, adults, max_results: 10 }),
    }),
  flightStatus: (flightNumber: string) =>
    apiFetch<Record<string, unknown>>(`/api/v1/pss/amadeus/status/${flightNumber}`),
  pnrLookup: (pnr: string) =>
    apiFetch<Record<string, unknown>>(`/api/v1/pss/amadeus/pnr/${pnr}`),
  status: () => apiFetch<PssStatus>('/api/v1/pss/status'),
};

// ─── Real-time Flight Data (Cirium/AODB) ──────────────────────────────────────

export interface LiveFlightStatus {
  source: string;
  flight_number: string;
  status: string;
  departure_delay_minutes: number;
  arrival_delay_minutes?: number;
  gate: string;
  terminal?: string;
  last_updated: string;
}

export interface DepartureFlight {
  source: string;
  flight_number: string;
  airline: string;
  destination: string;
  scheduled_departure: string;
  estimated_departure: string;
  delay_minutes: number;
  status: string;
  gate: string;
  terminal: string;
}

export interface SchedulerStatus {
  running: boolean;
  jobs: { id: string; name: string; next_run: string | null }[];
  last_runs: Record<string, string>;
}

export const flightDataApi = {
  status: (flightNumber: string) =>
    apiFetch<LiveFlightStatus>(`/api/v1/flight-data/status/${flightNumber}`),
  departures: (airport: string, limit = 12) =>
    apiFetch<{ airport: string; flights: DepartureFlight[] }>(`/api/v1/flight-data/departures/${airport}?limit=${limit}`),
  arrivals: (airport: string, limit = 12) =>
    apiFetch<{ airport: string; flights: DepartureFlight[] }>(`/api/v1/flight-data/arrivals/${airport}?limit=${limit}`),
  schedulerStatus: () => apiFetch<SchedulerStatus>('/api/v1/flight-data/scheduler/status'),
};

// ─── Voucher Engine ───────────────────────────────────────────────────────────

export interface VoucherBundle {
  pnr: string; passenger_name: string; ticket_class: string;
  wait_hours: number; package_label: string; total_value_eur: number;
  vouchers: { type: string; value_eur: number; code: string; valid_until: string; details: string; package_label: string }[];
  issued_at: string;
}

export const voucherApi = {
  forPnr: (pnr: string, waitHours: number) =>
    apiFetch<VoucherBundle>(`/api/v1/vouchers/${pnr}?wait_hours=${waitHours}`),
  bulkIssue: (crisisId: number, overrideHours?: number) =>
    apiFetch<{ crisis_id: number; passengers_issued: number; grand_total_eur: number; bundles: VoucherBundle[] }>(
      '/api/v1/vouchers/bulk-issue',
      { method: 'POST', body: JSON.stringify({ crisis_id: crisisId, override_wait_hours: overrideHours }) }
    ),
  rules: () => apiFetch<{ class_multipliers: Record<string,number>; rules: Record<string,unknown>[] }>('/api/v1/vouchers/rules/table'),
};

// ─── Cost Model ───────────────────────────────────────────────────────────────

export interface CostBreakdown {
  crisis_id: number; flight_number: string; aircraft_type: string;
  affected_passengers: number; delay_hours: number;
  eu261_liability_eur: number; catering_eur: number; hotel_eur: number;
  transfer_eur: number; crew_overtime_eur: number; slot_turnaround_eur: number;
  fuel_idle_eur: number; gds_rebooking_eur: number;
  total_operational_eur: number; revenue_loss_eur: number; total_impact_eur: number;
  load_factor_pct: number; avg_fare_eur: number; cost_per_pax_eur: number;
}

export interface CostSummary {
  total_crises: number; active_crises: number;
  total_eu261_eur: number; total_operational_eur: number;
  total_revenue_loss_eur: number; grand_total_eur: number;
  avg_cost_per_crisis_eur: number; avg_cost_per_pax_eur: number;
  by_crisis_type: Record<string, { count: number; total_eur: number }>;
}

export const costModelApi = {
  crisis: (crisisId: number) => apiFetch<CostBreakdown>(`/api/v1/cost-model/crisis/${crisisId}`),
  summary: () => apiFetch<CostSummary>('/api/v1/cost-model/summary'),
  benchmarks: () => apiFetch<{ benchmarks: Record<string,unknown>[] }>('/api/v1/cost-model/fleet/benchmarks'),
};

// ─── Gate / Hub Congestion ────────────────────────────────────────────────────

export interface HubCongestion {
  airport: string; overall_congestion_pct: number; alert_level: string;
  terminals: { terminal: string; pier: string; total_gates: number; occupied: number; available: number; congestion_pct: number; alert: boolean }[];
  total_gates: number; occupied_gates: number; available_gates: number;
}

export interface GateSuggestion {
  gate: number; terminal: string; pier: string; reason: string; score: number;
}

export const gateApi = {
  congestion: (airport = 'IST') => apiFetch<HubCongestion>(`/api/v1/gate/availability/${airport}`),
  suggest: (aircraftType: string, flightType = 'international', n = 3) =>
    apiFetch<GateSuggestion[]>(`/api/v1/gate/suggest?aircraft_type=${encodeURIComponent(aircraftType)}&flight_type=${flightType}&n=${n}`),
  board: (terminal?: string) =>
    apiFetch<{ gates: Record<string,unknown>[] }>(`/api/v1/gate/board${terminal ? `?terminal=${terminal}` : ''}`),
  assign: (flightNumber: string, gate: number, aircraftType: string) =>
    apiFetch<{ success: boolean; message: string }>(
      `/api/v1/gate/assign?flight_number=${encodeURIComponent(flightNumber)}&gate=${gate}&aircraft_type=${encodeURIComponent(aircraftType)}`,
      { method: 'POST' }
    ),
};

// ─── Call Center CRM ──────────────────────────────────────────────────────────

export interface CallContext {
  pnr: string; passenger_name: string; ticket_class: string; loyalty_tier: string;
  flight_number: string; origin: string; destination: string; special_needs?: string;
  crisis_active: boolean; crisis_type?: string; crisis_severity?: string;
  recommended_action?: string; compensation_eur: number;
  agent_script: { greeting: string; empathy: string; offer: string; next: string; closing: string; quick_actions: string[] };
  case_history: { ticket_id: number; subject: string; status: string; created_at: string }[];
}

export interface Ticket {
  ticket_id: number; pnr: string; subject: string; category: string;
  priority: string; status: string; notes: string; agent_id: string;
  created_at: string; updated_at: string;
}

export interface CallCenterStats {
  total_tickets: number; open: number; in_progress: number; resolved: number;
  avg_resolution_minutes: number; calls_today: number;
  satisfaction_score: number; first_call_resolution_pct: number;
}

export const callCenterApi = {
  lookup: (pnr: string) => apiFetch<CallContext>(`/api/v1/call-center/lookup/${pnr.toUpperCase()}`),
  createTicket: (pnr: string, subject: string, notes = '', priority = 'HIGH') =>
    apiFetch<Ticket>('/api/v1/call-center/tickets', {
      method: 'POST',
      body: JSON.stringify({ pnr: pnr.toUpperCase(), subject, notes, priority, category: 'IRROPS' }),
    }),
  tickets: (status?: string) =>
    apiFetch<Ticket[]>(`/api/v1/call-center/tickets${status ? `?status=${status}` : ''}`),
  updateTicket: (id: number, status: string, notes?: string) =>
    apiFetch<Ticket>(`/api/v1/call-center/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    }),
  stats: () => apiFetch<CallCenterStats>('/api/v1/call-center/stats'),
};
