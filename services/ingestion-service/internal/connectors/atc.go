package connectors

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// SlotInfo holds normalized ATC/slot data from Eurocontrol Network Manager B2B.
type SlotInfo struct {
	FlightID       string    `json:"flight_id"`
	FlightNumber   string    `json:"flight_number"`
	ADEP           string    `json:"adep"`                  // Aerodrome of Departure (ICAO)
	ADES           string    `json:"ades"`                  // Aerodrome of Destination (ICAO)
	EOBT           time.Time `json:"eobt"`                  // Estimated Off-Block Time
	CTOT           time.Time `json:"ctot"`                  // Calculated Take-Off Time
	SlotTolerancePlus  int   `json:"slot_tolerance_plus"`   // minutes after CTOT
	SlotToleranceMinus int   `json:"slot_tolerance_minus"`  // minutes before CTOT
	FlowMeasure    string    `json:"flow_measure"`          // MCDM, CTFM, REG, etc.
	Reason         string    `json:"reason"`
	Status         string    `json:"status"`                // ALLOCATED, CANCELLED, REVISED
	FetchedAt      time.Time `json:"fetched_at"`
}

// ATCConnector interfaces with the Eurocontrol Network Manager B2B (NM B2B)
// to retrieve CTOT slots, flow restrictions, and slot cancellations.
// NM B2B uses SOAP/XML in production; this connector wraps the REST-facade
// that airlines can deploy in front of the NM B2B gateway.
type ATCConnector struct {
	BaseURL    string
	APIKey     string
	HTTPClient *http.Client
}

func NewATCConnector(baseURL, apiKey string) *ATCConnector {
	return &ATCConnector{
		BaseURL:    baseURL,
		APIKey:     apiKey,
		HTTPClient: &http.Client{Timeout: 15 * time.Second},
	}
}

// FetchSlot retrieves the current CTOT slot allocation for a flight.
// Endpoint mirrors Eurocontrol NM B2B FlightRetrievalService.
func (a *ATCConnector) FetchSlot(ctx context.Context, flightNumber string, dep time.Time) (*SlotInfo, error) {
	url := fmt.Sprintf("%s/slots?flight=%s&date=%s",
		a.BaseURL, flightNumber, dep.Format("2006-01-02"))

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("atc slot request: %w", err)
	}
	req.Header.Set("X-NM-API-Key", a.APIKey)
	req.Header.Set("Accept", "application/json")

	resp, err := a.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("atc slot fetch: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, nil // no slot currently allocated
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("atc slot read: %w", err)
	}

	var raw struct {
		FlightID     string `json:"flightId"`
		FlightNumber string `json:"flightNumber"`
		ADEP         string `json:"adep"`
		ADES         string `json:"ades"`
		EOBT         string `json:"eobt"`
		CTOT         string `json:"ctot"`
		Tolerance    struct {
			Plus  int `json:"plus"`
			Minus int `json:"minus"`
		} `json:"tolerance"`
		FlowMeasure string `json:"flowMeasure"`
		Reason      string `json:"reason"`
		Status      string `json:"status"`
	}

	if err := json.Unmarshal(body, &raw); err != nil {
		return nil, fmt.Errorf("atc slot unmarshal: %w", err)
	}

	eobt, _ := time.Parse(time.RFC3339, raw.EOBT)
	ctot, _ := time.Parse(time.RFC3339, raw.CTOT)

	return &SlotInfo{
		FlightID:           raw.FlightID,
		FlightNumber:       raw.FlightNumber,
		ADEP:               raw.ADEP,
		ADES:               raw.ADES,
		EOBT:               eobt,
		CTOT:               ctot,
		SlotTolerancePlus:  raw.Tolerance.Plus,
		SlotToleranceMinus: raw.Tolerance.Minus,
		FlowMeasure:        raw.FlowMeasure,
		Reason:             raw.Reason,
		Status:             raw.Status,
		FetchedAt:          time.Now().UTC(),
	}, nil
}

// FetchFlowRestrictions retrieves active ATFM flow restrictions for a given ICAO airport.
// Critical for IOCC scenario simulation — restrictions can block all departures.
func (a *ATCConnector) FetchFlowRestrictions(ctx context.Context, airportICAO string) ([]SlotInfo, error) {
	url := fmt.Sprintf("%s/regulations?airport=%s", a.BaseURL, airportICAO)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("atc regulations request: %w", err)
	}
	req.Header.Set("X-NM-API-Key", a.APIKey)
	req.Header.Set("Accept", "application/json")

	resp, err := a.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("atc regulations fetch: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("atc regulations read: %w", err)
	}

	var rawList []struct {
		FlightID    string `json:"flightId"`
		ADEP        string `json:"adep"`
		ADES        string `json:"ades"`
		CTOT        string `json:"ctot"`
		FlowMeasure string `json:"flowMeasure"`
		Reason      string `json:"reason"`
		Status      string `json:"status"`
	}

	if err := json.Unmarshal(body, &rawList); err != nil {
		return nil, fmt.Errorf("atc regulations unmarshal: %w", err)
	}

	results := make([]SlotInfo, 0, len(rawList))
	for _, r := range rawList {
		ctot, _ := time.Parse(time.RFC3339, r.CTOT)
		results = append(results, SlotInfo{
			FlightID:    r.FlightID,
			ADEP:        r.ADEP,
			ADES:        r.ADES,
			CTOT:        ctot,
			FlowMeasure: r.FlowMeasure,
			Reason:      r.Reason,
			Status:      r.Status,
			FetchedAt:   time.Now().UTC(),
		})
	}
	return results, nil
}
