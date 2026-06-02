package models

import "time"

// PassengerProfile is the canonical normalized passenger record produced by
// PSS adapters. The core AI never sees Amadeus/Sabre-specific schemas.
type PassengerProfile struct {
	PNR             string    `json:"pnr"`
	FirstName       string    `json:"first_name"`
	LastName        string    `json:"last_name"`
	Email           string    `json:"email"`
	Phone           string    `json:"phone"`
	TicketNumber    string    `json:"ticket_number"`
	TicketClass     string    `json:"ticket_class"`      // ECONOMY, BUSINESS, FIRST
	LoyaltyTier     string    `json:"loyalty_tier"`      // NONE, SILVER, GOLD, PLATINUM
	LoyaltyID       string    `json:"loyalty_id"`        // FFP number
	SeatNumber      string    `json:"seat_number"`
	SpecialNeeds    []string  `json:"special_needs"`     // WCHR, DEAF, BLIND, etc.
	FlightNumber    string    `json:"flight_number"`
	BookingRef      string    `json:"booking_reference"`
	CheckedIn       bool      `json:"checked_in"`
	BaggageCount    int       `json:"baggage_count"`
	Nationality     string    `json:"nationality"`        // ISO-3166-1 alpha-2
	DateOfBirth     time.Time `json:"date_of_birth,omitempty"`
	PSS             string    `json:"pss_source"`         // AMADEUS, SABRE, SITA, CUSTOM
	RawPSSReference string    `json:"raw_pss_reference"`  // original record ID in PSS
}

// PassengerProfileResponse wraps a PassengerProfile for API responses.
type PassengerProfileResponse struct {
	Status  string           `json:"status"`
	Profile PassengerProfile `json:"profile"`
}
