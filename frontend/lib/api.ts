const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('jetnexus_token')
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(body.detail ?? res.statusText)
  }
  return res.json() as Promise<T>
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  access_token: string
  token_type: string
  user: {
    id: number
    email: string
    name: string
    role: string
    avatar: string
  }
}

export interface User {
  id: number
  email: string
  name: string   // API returns "name", not "full_name"
  role: string
  avatar?: string
}

// /api/v1/stats gerçek yanıt şekli
export interface DashboardStats {
  crises: { total: number; active: number; resolved: number }
  passengers: number
  flights: number
  decisions: number
  total_compensation_eur: number
}

export interface Crisis {
  id: string
  flight_number: string
  origin: string
  destination: string
  crisis_type: string
  severity: string
  status: string
  affected_passengers: number
  created_at: string
  updated_at: string
}

export interface Decision {
  id: string
  crisis_id: string
  passenger_id: string
  action: string
  new_flight?: string
  hotel?: string
  compensation?: number
  status: string
  confidence: number
  created_at: string
}

export interface AuditLog {
  id: number
  crisis_id: number
  agent: string
  action: string
  details: string
  confidence: number
  timestamp: string
}

// /api/v1/pcc/passengers/at-risk'in her bir elemanı
export interface PccPassenger {
  passenger_id: number
  pnr: string
  name: string
  ticket_class: string
  loyalty_tier: string
  special_needs?: string
  ssr_codes?: string[]
  priority_score: number
  requires_staff_escort?: boolean
  recovery_notes?: string[]
  flight_number: string
  origin?: string
  destination?: string
  crisis_type?: string
  crisis_severity?: string
  recommended_action?: string
  compensation_eur?: number
  hotel?: string
  decision_status: string
  agent_confidence?: number
}

// /api/v1/pcc/summary gerçek alan isimleri
export interface PccSummary {
  pending_decisions: number
  executed_decisions: number
  total_compensation_paid_eur: number
  active_crises: number
}

export interface IoccDashboard {
  active_crises: Crisis[]
  pending_approvals: Decision[]
  fleet_summary: Record<string, number>
}

export interface RevenueSummary {
  total_compensation_eur: number
  total_hotel_cost_eur: number
  total_rebooking_cost_eur: number
  total_revenue_loss_eur: number
  active_crises: number
}

export interface RiskScore {
  flight_number: string
  origin: string
  destination: string
  departure_time: string
  risk_level: 'critical' | 'high' | 'medium' | 'low'
  risk_score: number
  risk_factors: string[]
}

export interface PredictionSummary {
  critical_alerts: number
  high_risk: number
  medium_risk: number
  low_risk: number
}

export interface CallCenterStats {
  open_tickets: number
  avg_resolution_minutes: number
  satisfaction_score: number
  calls_today: number
}

export interface HubSummary {
  at_risk_connections: number
  missed_connections: number
  avg_connection_time_minutes: number
  protected_count: number
}

export interface Flight {
  id: string
  flight_number: string
  origin: string
  destination: string
  scheduled_departure: string
  scheduled_arrival: string
  status: string
  available_seats: number
  aircraft_type: string
}

export interface VoucherPackage {
  pnr: string
  vouchers: { type: string; amount_eur: number; description: string }[]
  total_eur: number
}

// ── Auth API ───────────────────────────────────────────────────────────────────

export const authApi = {
  // Backend LoginRequest: { email: str, password: str } — JSON body, NOT form-urlencoded
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Giriş başarısız' }))
      throw new Error(err.detail ?? 'Giriş başarısız')
    }
    return res.json()
  },
  me: () => request<User>('/api/v1/auth/me'),
}

// ── Dashboard ──────────────────────────────────────────────────────────────────

export const dashboardApi = {
  stats: () => request<DashboardStats>('/api/v1/stats'),
}

// ── Crisis ─────────────────────────────────────────────────────────────────────

export const crisisApi = {
  active: () => request<Crisis[]>('/api/v1/crisis/active'),
  list: (page = 1, size = 20) =>
    request<Crisis[]>(`/api/v1/crisis?page=${page}&size=${size}`),
  get: (id: string) => request<Crisis>(`/api/v1/crisis/${id}`),
  trigger: (data: {
    flight_number: string
    crisis_type: string
    severity: string
    description?: string
  }) =>
    request<Crisis>('/api/v1/crisis/trigger', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  approve: (id: string) =>
    request<void>(`/api/v1/crisis/${id}/approve`, { method: 'POST' }),
  updateStatus: (id: string, status: string) =>
    request<Crisis>(`/api/v1/crisis/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  decisions: (id: string) => request<Decision[]>(`/api/v1/crisis/${id}/decisions`),
  audit: (id: string) => request<AuditLog[]>(`/api/v1/crisis/${id}/audit`),
}

// ── PCC ────────────────────────────────────────────────────────────────────────

export const pccApi = {
  // Returns { count: number, passengers: PccPassenger[] } — unwrap the array
  atRisk: async (): Promise<PccPassenger[]> => {
    const res = await request<{ count: number; passengers: PccPassenger[] }>(
      '/api/v1/pcc/passengers/at-risk'
    )
    return res.passengers ?? []
  },
  summary: () => request<PccSummary>('/api/v1/pcc/summary'),
  passenger: (pnr: string) => request<unknown>(`/api/v1/pcc/passengers/${pnr}`),
}

// ── IOCC ───────────────────────────────────────────────────────────────────────

export const ioccApi = {
  dashboard: () => request<IoccDashboard>('/api/v1/iocc/dashboard'),
  approveAll: (crisisId: string) =>
    request<{ approved: number }>(
      `/api/v1/iocc/crisis/${crisisId}/approve-all`,
      { method: 'POST' }
    ),
  rejectDecision: (crisisId: string, decisionId: string, reason = 'Operatör iptali') =>
    request<void>(
      `/api/v1/iocc/crisis/${crisisId}/reject-decision/${decisionId}`,
      { method: 'POST', body: JSON.stringify({ reason }) }
    ),
  simulate: (data: Record<string, unknown>) =>
    request<unknown>('/api/v1/iocc/scenario/simulate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  audit: () => request<AuditLog[]>('/api/v1/iocc/audit/recent'),
}

// ── Hub Control ────────────────────────────────────────────────────────────────

export const hubApi = {
  atRisk: () => request<unknown[]>('/api/v1/hub/connections/at-risk'),
  missed: () => request<unknown[]>('/api/v1/hub/connections/missed'),
  summary: () => request<HubSummary>('/api/v1/hub/connections/summary'),
  activeFlights: () => request<Flight[]>('/api/v1/hub/flights/active'),
}

// ── Vouchers ───────────────────────────────────────────────────────────────────

export const vouchersApi = {
  get: (pnr: string) => request<VoucherPackage>(`/api/v1/vouchers/${pnr}`),
  bulkIssue: (crisisId: string) =>
    request<{ issued: number }>('/api/v1/vouchers/bulk-issue', {
      method: 'POST',
      body: JSON.stringify({ crisis_id: crisisId }),
    }),
  rules: () => request<unknown[]>('/api/v1/vouchers/rules/table'),
}

// ── Revenue ────────────────────────────────────────────────────────────────────

export const revenueApi = {
  summary: () => request<RevenueSummary>('/api/v1/revenue/impact/summary'),
  byCrisis: () => request<unknown[]>('/api/v1/revenue/impact/by-crisis'),
  byClass: () => request<unknown[]>('/api/v1/revenue/impact/by-class'),
  efficiency: () => request<unknown>('/api/v1/revenue/efficiency'),
}

// ── Flights ────────────────────────────────────────────────────────────────────

export const flightsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : ''
    return request<Flight[]>(`/api/v1/flights${qs}`)
  },
  get: (id: string) => request<Flight>(`/api/v1/flights/${id}`),
}

// ── Prediction ─────────────────────────────────────────────────────────────────

export const predictionApi = {
  riskScores: () => request<RiskScore[]>('/api/v1/prediction/risk-scores'),
  summary: () => request<PredictionSummary>('/api/v1/prediction/summary'),
}

// ── Call Center ────────────────────────────────────────────────────────────────

export const callCenterApi = {
  stats: () => request<CallCenterStats>('/api/v1/call-center/stats'),
  lookup: (pnr: string) => request<unknown>(`/api/v1/call-center/lookup/${pnr}`),
  tickets: () => request<unknown[]>('/api/v1/call-center/tickets'),
  createTicket: (data: unknown) =>
    request<unknown>('/api/v1/call-center/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// ── Proactive ──────────────────────────────────────────────────────────────────

export const proactiveApi = {
  notifyCrisis: (crisisId: string) =>
    request<{ sent: number }>(`/api/v1/proactive/notify-crisis/${crisisId}`, {
      method: 'POST',
    }),
  cascadeRisk: (flightNumber: string) =>
    request<unknown>(`/api/v1/proactive/cascade-risk/${flightNumber}`),
  allianceSeats: () => request<unknown[]>('/api/v1/proactive/alliance-seats'),
}

// ── Simulation ─────────────────────────────────────────────────────────────────

export const simulationApi = {
  run: (data: unknown) =>
    request<unknown>('/api/v1/simulation/run', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  history: () => request<unknown[]>('/api/v1/simulation/history'),
}

// ── Departure Hold ─────────────────────────────────────────────────────────────

export const departureHoldApi = {
  quick: (flightNumber: string) =>
    request<unknown>(`/api/v1/departure-hold/quick/${flightNumber}`),
  analyze: (data: unknown) =>
    request<unknown>('/api/v1/departure-hold/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// ── Health ─────────────────────────────────────────────────────────────────────

export const healthApi = {
  ping: () => request<{ status: string }>('/health'),
  ready: () => request<{ status: string; database: string }>('/health/ready'),
}
