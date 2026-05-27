export type TicketClass = 'ECONOMY' | 'BUSINESS' | 'FIRST';
export type LoyaltyTier = 'NONE' | 'SILVER' | 'GOLD' | 'PLATINUM';
export type FlightStatus = 'SCHEDULED' | 'DELAYED' | 'CANCELLED' | 'DIVERTED';
export type CrisisType = 'CANCELLATION' | 'DELAY' | 'DIVERSION';
export type CrisisSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CrisisStatus = 'ACTIVE' | 'RESOLVING' | 'RESOLVED';
export type DecisionAction = 'REBOOK' | 'COMPENSATE' | 'HOTEL' | 'MEAL' | 'REFUND' | 'NO_ACTION';
export type DecisionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED';

export interface Passenger {
  id: number;
  pnr: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  ticket_class: TicketClass;
  loyalty_tier: LoyaltyTier;
  special_needs?: string;
  booking_reference: string;
  created_at?: string;
}

export interface Flight {
  id: number;
  flight_number: string;
  origin: string;
  destination: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  status: FlightStatus;
  aircraft_type: string;
  total_capacity: number;
  available_seats: number;
  distance_km: number;
}

export interface CrisisEvent {
  id: number;
  crisis_type: CrisisType;
  affected_flight_id: number;
  reason: string;
  severity: CrisisSeverity;
  triggered_at: string;
  resolved_at?: string;
  status: CrisisStatus;
  affected_passenger_count: number;
}

export interface Decision {
  id: number;
  crisis_id: number;
  passenger_id: number;
  action: DecisionAction;
  new_flight_id?: number;
  compensation_amount_eur: number;
  hotel_name?: string;
  status: DecisionStatus;
  agent_confidence: number;
  agent_reasoning?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardStats {
  active_crises: number;
  affected_passengers: number;
  resolved_cases: number;
  avg_resolution_minutes: number;
}

export interface AgentActivity {
  name: string;
  status: 'IDLE' | 'THINKING' | 'DECIDING' | 'DONE';
  last_action: string;
  confidence: number;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  event_type: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
}
