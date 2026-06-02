package connectors

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// GateInfo holds normalized AODB gate and terminal assignment data (ACRIS standard).
type GateInfo struct {
	FlightNumber  string    `json:"flight_number"`
	Airport       string    `json:"airport_icao"`
	Terminal      string    `json:"terminal"`
	Gate          string    `json:"gate"`
	CheckInDesk   string    `json:"checkin_desk"`
	BaggageBelt   string    `json:"baggage_belt"`
	BoardingTime  time.Time `json:"boarding_time"`
	DepartureTime time.Time `json:"departure_time"`
	GateStatus    string    `json:"gate_status"` // OPEN, BOARDING, CLOSED, CHANGED
	FetchedAt     time.Time `json:"fetched_at"`
}

// AODBConnector fetches gate, terminal, and taxiway data from an AODB
// that implements the ACRIS (Airport Community Recommended Information Services) standard.
type AODBConnector struct {
	BaseURL    string
	APIKey     string
	HTTPClient *http.Client
}

func NewAODBConnector(baseURL, apiKey string) *AODBConnector {
	return &AODBConnector{
		BaseURL:    baseURL,
		APIKey:     apiKey,
		HTTPClient: &http.Client{Timeout: 10 * time.Second},
	}
}

// FetchGateInfo retrieves current gate assignment for a flight.
// ACRIS REST endpoint: GET /flight-information/departures/{flightNumber}
func (a *AODBConnector) FetchGateInfo(ctx context.Context, flightNumber string) (*GateInfo, error) {
	url := fmt.Sprintf("%s/flight-information/departures/%s", a.BaseURL, flightNumber)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("aodb request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+a.APIKey)
	req.Header.Set("Accept", "application/json")

	resp, err := a.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("aodb fetch: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, fmt.Errorf("aodb: flight %s not found", flightNumber)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("aodb read: %w", err)
	}

	// ACRIS standard departure resource schema
	var raw struct {
		FlightIdentifier struct {
			FlightNumber string `json:"FlightNumber"`
			Airport      string `json:"AirportCode"`
		} `json:"FlightIdentifier"`
		Departure struct {
			Terminal   string `json:"TerminalName"`
			Gate       string `json:"GateNumber"`
			CheckIn    string `json:"CheckInDeskRange"`
			Baggage    string `json:"BaggageBeltNumber"`
			BoardingAt string `json:"BoardingTime"`    // ISO8601
			DepTime    string `json:"DepartureTime"`   // ISO8601
			GateStatus string `json:"GateStatus"`
		} `json:"Departure"`
	}

	if err := json.Unmarshal(body, &raw); err != nil {
		return nil, fmt.Errorf("aodb unmarshal: %w", err)
	}

	boardingTime, _ := time.Parse(time.RFC3339, raw.Departure.BoardingAt)
	depTime, _ := time.Parse(time.RFC3339, raw.Departure.DepTime)

	return &GateInfo{
		FlightNumber:  flightNumber,
		Airport:       raw.FlightIdentifier.Airport,
		Terminal:      raw.Departure.Terminal,
		Gate:          raw.Departure.Gate,
		CheckInDesk:   raw.Departure.CheckIn,
		BaggageBelt:   raw.Departure.Baggage,
		BoardingTime:  boardingTime,
		DepartureTime: depTime,
		GateStatus:    raw.Departure.GateStatus,
		FetchedAt:     time.Now().UTC(),
	}, nil
}

// FetchTerminalMap returns all active departures at an airport with gate assignments.
// Useful for the Hub Control screen real-time display.
func (a *AODBConnector) FetchTerminalMap(ctx context.Context, airportICAO string, windowHours int) ([]GateInfo, error) {
	url := fmt.Sprintf("%s/flight-information/departures?airport=%s&window=%d",
		a.BaseURL, airportICAO, windowHours)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("aodb terminal map request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+a.APIKey)
	req.Header.Set("Accept", "application/json")

	resp, err := a.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("aodb terminal map fetch: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("aodb terminal map read: %w", err)
	}

	var rawList []struct {
		FlightNumber string `json:"FlightNumber"`
		Terminal     string `json:"TerminalName"`
		Gate         string `json:"GateNumber"`
		BoardingAt   string `json:"BoardingTime"`
		DepTime      string `json:"DepartureTime"`
		GateStatus   string `json:"GateStatus"`
	}
	if err := json.Unmarshal(body, &rawList); err != nil {
		return nil, fmt.Errorf("aodb terminal map unmarshal: %w", err)
	}

	results := make([]GateInfo, 0, len(rawList))
	for _, r := range rawList {
		boardingTime, _ := time.Parse(time.RFC3339, r.BoardingAt)
		depTime, _ := time.Parse(time.RFC3339, r.DepTime)
		results = append(results, GateInfo{
			FlightNumber:  r.FlightNumber,
			Airport:       airportICAO,
			Terminal:      r.Terminal,
			Gate:          r.Gate,
			BoardingTime:  boardingTime,
			DepartureTime: depTime,
			GateStatus:    r.GateStatus,
			FetchedAt:     time.Now().UTC(),
		})
	}
	return results, nil
}
