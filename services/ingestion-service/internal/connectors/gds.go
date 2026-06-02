package connectors

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// InterlineInventory holds available seat inventory on partner airlines via GDS/BSP.
type InterlineInventory struct {
	CarrierCode    string    `json:"carrier_code"`
	FlightNumber   string    `json:"flight_number"`
	DepartureICAO  string    `json:"departure_icao"`
	ArrivalICAO    string    `json:"arrival_icao"`
	DepartureTime  time.Time `json:"departure_time"`
	ArrivalTime    time.Time `json:"arrival_time"`
	AvailableSeats map[string]int `json:"available_seats"` // class → count
	FareClass      string    `json:"fare_class"`       // IATA fare basis
	ThroughFare    float64   `json:"through_fare_eur"`
	Interlineable  bool      `json:"interlineable"`   // true = can book via BSP
	BSPAgreement   string    `json:"bsp_agreement"`   // e.g. "IATA_BSP_EUROPE"
	FetchedAt      time.Time `json:"fetched_at"`
}

// GDSConnector queries the Global Distribution System for interline seat availability.
// Uses the IATA BSP (Billing and Settlement Plan) API to retrieve partner airline
// inventory for rebooking IRROPS passengers on other carriers.
type GDSConnector struct {
	BaseURL    string
	APIKey     string
	AgentID    string // IATA agent code of the airline
	HTTPClient *http.Client
}

func NewGDSConnector(baseURL, apiKey, agentID string) *GDSConnector {
	return &GDSConnector{
		BaseURL:    baseURL,
		APIKey:     apiKey,
		AgentID:    agentID,
		HTTPClient: &http.Client{Timeout: 15 * time.Second},
	}
}

// SearchInterlineFlights queries GDS for available partner flights between two airports
// within a time window. Used by the IRROPS engine when no own-metal alternative exists.
func (g *GDSConnector) SearchInterlineFlights(
	ctx context.Context,
	origin, destination string,
	after time.Time,
	before time.Time,
) ([]InterlineInventory, error) {
	url := fmt.Sprintf("%s/availability?origin=%s&destination=%s&from=%s&to=%s&agent=%s",
		g.BaseURL, origin, destination,
		after.Format(time.RFC3339), before.Format(time.RFC3339),
		g.AgentID)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("gds availability request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+g.APIKey)
	req.Header.Set("Accept", "application/json")

	resp, err := g.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("gds availability fetch: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("gds availability read: %w", err)
	}

	var rawList []struct {
		Carrier    string `json:"carrier"`
		FlightNo   string `json:"flightNumber"`
		Origin     string `json:"origin"`
		Dest       string `json:"destination"`
		DepTime    string `json:"departureTime"`
		ArrTime    string `json:"arrivalTime"`
		Seats      map[string]int `json:"seats"`
		FareBasis  string `json:"fareBasis"`
		Fare       float64 `json:"throughFareEUR"`
		Interline  bool   `json:"interlineable"`
		BSP        string `json:"bspAgreement"`
	}
	if err := json.Unmarshal(body, &rawList); err != nil {
		return nil, fmt.Errorf("gds availability unmarshal: %w", err)
	}

	results := make([]InterlineInventory, 0, len(rawList))
	for _, r := range rawList {
		depTime, _ := time.Parse(time.RFC3339, r.DepTime)
		arrTime, _ := time.Parse(time.RFC3339, r.ArrTime)
		results = append(results, InterlineInventory{
			CarrierCode:   r.Carrier,
			FlightNumber:  r.FlightNo,
			DepartureICAO: r.Origin,
			ArrivalICAO:   r.Dest,
			DepartureTime: depTime,
			ArrivalTime:   arrTime,
			AvailableSeats: r.Seats,
			FareClass:     r.FareBasis,
			ThroughFare:   r.Fare,
			Interlineable: r.Interline,
			BSPAgreement:  r.BSP,
			FetchedAt:     time.Now().UTC(),
		})
	}
	return results, nil
}

// FetchBSPInventory retrieves pre-agreed interline block space from a specific carrier.
// Block-space agreements are pre-negotiated and have guaranteed seat counts.
func (g *GDSConnector) FetchBSPInventory(ctx context.Context, carrierCode, flightNumber string) (*InterlineInventory, error) {
	url := fmt.Sprintf("%s/bsp-inventory?carrier=%s&flight=%s&agent=%s",
		g.BaseURL, carrierCode, flightNumber, g.AgentID)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("gds bsp request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+g.APIKey)

	resp, err := g.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("gds bsp fetch: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, nil
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("gds bsp read: %w", err)
	}

	var raw struct {
		Carrier   string         `json:"carrier"`
		FlightNo  string         `json:"flightNumber"`
		Origin    string         `json:"origin"`
		Dest      string         `json:"destination"`
		DepTime   string         `json:"departureTime"`
		ArrTime   string         `json:"arrivalTime"`
		Seats     map[string]int `json:"seats"`
		FareBasis string         `json:"fareBasis"`
		Fare      float64        `json:"throughFareEUR"`
		BSP       string         `json:"bspAgreement"`
	}
	if err := json.Unmarshal(body, &raw); err != nil {
		return nil, fmt.Errorf("gds bsp unmarshal: %w", err)
	}

	depTime, _ := time.Parse(time.RFC3339, raw.DepTime)
	arrTime, _ := time.Parse(time.RFC3339, raw.ArrTime)

	return &InterlineInventory{
		CarrierCode:    raw.Carrier,
		FlightNumber:   raw.FlightNo,
		DepartureICAO:  raw.Origin,
		ArrivalICAO:    raw.Dest,
		DepartureTime:  depTime,
		ArrivalTime:    arrTime,
		AvailableSeats: raw.Seats,
		FareClass:      raw.FareBasis,
		ThroughFare:    raw.Fare,
		Interlineable:  true,
		BSPAgreement:   raw.BSP,
		FetchedAt:      time.Now().UTC(),
	}, nil
}
