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
