package models

import "time"

// FlightEvent represents an incoming flight event from airline systems.
type FlightEvent struct {
	EventID            string    `json:"event_id" binding:"required"`
	EventType          string    `json:"event_type" binding:"required,oneof=DELAY CANCELLATION DIVERSION GATE_CHANGE BOARDING DEPARTURE ARRIVAL"`
	FlightNumber       string    `json:"flight_number" binding:"required"`
	Origin             string    `json:"origin" binding:"required,len=3"`
	Destination        string    `json:"destination" binding:"required,len=3"`
	ScheduledDeparture time.Time `json:"scheduled_departure" binding:"required"`
	ActualDeparture    time.Time `json:"actual_departure,omitempty"`
	Status             string    `json:"status" binding:"required,oneof=ON_TIME DELAYED CANCELLED DIVERTED BOARDING DEPARTED ARRIVED"`
	Reason             string    `json:"reason,omitempty"`
	DelayMinutes       int       `json:"delay_minutes,omitempty"`
	AircraftType       string    `json:"aircraft_type,omitempty"`
	Timestamp          time.Time `json:"timestamp" binding:"required"`
}

// FlightEventResponse is returned after successfully accepting an event.
type FlightEventResponse struct {
	Status  string `json:"status"`
	EventID string `json:"event_id"`
	Message string `json:"message"`
}

// ErrorResponse represents a standard error response.
type ErrorResponse struct {
	Error   string `json:"error"`
	Details string `json:"details,omitempty"`
}
