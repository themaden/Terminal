-- 🛫 Aero-Agent Database Initialization Schema
-- Creating all core tables and constraints

CREATE TABLE IF NOT EXISTS passengers (
    id SERIAL PRIMARY KEY,
    pnr VARCHAR(6) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    ticket_class VARCHAR(20) NOT NULL DEFAULT 'ECONOMY',
    loyalty_tier VARCHAR(20) NOT NULL DEFAULT 'NONE',
    special_needs VARCHAR(255),
    booking_reference VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flights (
    id SERIAL PRIMARY KEY,
    flight_number VARCHAR(20) UNIQUE NOT NULL,
    origin VARCHAR(3) NOT NULL,
    destination VARCHAR(3) NOT NULL,
    scheduled_departure TIMESTAMP NOT NULL,
    scheduled_arrival TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    aircraft_type VARCHAR(50) NOT NULL,
    total_capacity INTEGER NOT NULL,
    available_seats INTEGER NOT NULL,
    distance_km FLOAT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crises (
    id SERIAL PRIMARY KEY,
    crisis_type VARCHAR(20) NOT NULL,
    affected_flight_id INTEGER NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
    reason VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    triggered_at TIMESTAMP NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    affected_passenger_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS decisions (
    id SERIAL PRIMARY KEY,
    crisis_id INTEGER NOT NULL REFERENCES crises(id) ON DELETE CASCADE,
    passenger_id INTEGER NOT NULL REFERENCES passengers(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL,
    new_flight_id INTEGER REFERENCES flights(id) ON DELETE SET NULL,
    compensation_amount_eur FLOAT NOT NULL DEFAULT 0.0,
    hotel_name VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    agent_confidence FLOAT NOT NULL DEFAULT 1.0,
    agent_reasoning TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    crisis_id INTEGER REFERENCES crises(id) ON DELETE SET NULL,
    agent_name VARCHAR(100) NOT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT NOT NULL,
    confidence FLOAT NOT NULL DEFAULT 1.0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indices for performance optimisation under heavy load
CREATE INDEX IF NOT EXISTS idx_passengers_pnr ON passengers(pnr);
CREATE INDEX IF NOT EXISTS idx_flights_flight_number ON flights(flight_number);
CREATE INDEX IF NOT EXISTS idx_decisions_crisis_id ON decisions(crisis_id);
CREATE INDEX IF NOT EXISTS idx_decisions_passenger_id ON decisions(passenger_id);

-- ──────────────────────────────────────────────────────────
-- IRROPS AI Integration Tables
-- ──────────────────────────────────────────────────────────

-- PSS adapter registry: tracks which PSS system each event came from
CREATE TABLE IF NOT EXISTS pss_adapter_events (
    id SERIAL PRIMARY KEY,
    source VARCHAR(20) NOT NULL,           -- AMADEUS, SABRE, SITA, CUSTOM
    airline_code VARCHAR(10),
    event_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    flight_number VARCHAR(20),
    raw_format VARCHAR(20),                -- NDC, EDIFACT, REST, SITA, CUSTOM
    normalized_event_id VARCHAR(255),      -- links to flight-events Kafka message
    received_at TIMESTAMP NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'RECEIVED'  -- RECEIVED, NORMALIZED, FAILED
);

-- Connection tracking: MCT/ACT real-time records for connecting passengers
CREATE TABLE IF NOT EXISTS connection_events (
    id SERIAL PRIMARY KEY,
    passenger_id INTEGER REFERENCES passengers(id) ON DELETE CASCADE,
    inbound_flight VARCHAR(20) NOT NULL,
    outbound_flight VARCHAR(20) NOT NULL,
    hub_airport VARCHAR(4) NOT NULL,        -- ICAO code
    connection_type VARCHAR(2) NOT NULL DEFAULT 'II', -- DD, DI, ID, II
    mct_minutes INTEGER NOT NULL,
    act_minutes INTEGER,
    inbound_eta TIMESTAMP NOT NULL,
    outbound_std TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OK', -- OK, AT_RISK, CRITICAL, MISSED
    alert_sent BOOLEAN NOT NULL DEFAULT FALSE,
    last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Operational events: weather, AODB, ATC/slot data snapshots
CREATE TABLE IF NOT EXISTS operational_events (
    id SERIAL PRIMARY KEY,
    event_source VARCHAR(20) NOT NULL,      -- WEATHER, AODB, ATC, GDS
    airport_icao VARCHAR(4),
    flight_number VARCHAR(20),
    event_data JSONB NOT NULL,             -- raw normalized payload
    severity VARCHAR(20) NOT NULL DEFAULT 'NORMAL', -- NORMAL, CAUTION, WARNING, EXTREME
    valid_from TIMESTAMP,
    valid_to TIMESTAMP,
    fetched_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Revenue impact: financial tracking per crisis
CREATE TABLE IF NOT EXISTS revenue_impact (
    id SERIAL PRIMARY KEY,
    crisis_id INTEGER NOT NULL REFERENCES crises(id) ON DELETE CASCADE,
    eu261_compensation_eur FLOAT NOT NULL DEFAULT 0.0,
    hotel_cost_eur FLOAT NOT NULL DEFAULT 0.0,
    meal_voucher_cost_eur FLOAT NOT NULL DEFAULT 0.0,
    transport_cost_eur FLOAT NOT NULL DEFAULT 0.0,
    rebooking_cost_eur FLOAT NOT NULL DEFAULT 0.0,
    total_cost_eur FLOAT GENERATED ALWAYS AS (
        eu261_compensation_eur + hotel_cost_eur + meal_voucher_cost_eur +
        transport_cost_eur + rebooking_cost_eur
    ) STORED,
    recovered_passengers INTEGER NOT NULL DEFAULT 0,
    total_affected_passengers INTEGER NOT NULL DEFAULT 0,
    recovery_rate_pct FLOAT,
    calculated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pss_adapter_events_source ON pss_adapter_events(source);
CREATE INDEX IF NOT EXISTS idx_pss_adapter_events_flight ON pss_adapter_events(flight_number);
CREATE INDEX IF NOT EXISTS idx_connection_events_passenger ON connection_events(passenger_id);
CREATE INDEX IF NOT EXISTS idx_connection_events_status ON connection_events(status);
CREATE INDEX IF NOT EXISTS idx_operational_events_airport ON operational_events(airport_icao);
CREATE INDEX IF NOT EXISTS idx_operational_events_source ON operational_events(event_source);
CREATE INDEX IF NOT EXISTS idx_revenue_impact_crisis ON revenue_impact(crisis_id);
