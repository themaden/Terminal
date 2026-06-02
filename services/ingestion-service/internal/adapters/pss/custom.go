package pss

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/aero-agent/ingestion-service/internal/models"
)

// CustomAdapter handles airline-specific proprietary formats (e.g. THY, Pegasus).
// Each airline using this adapter defines its own JSON schema; the adapter maps
// it onto the canonical models via a configurable field-mapping table.
type CustomAdapter struct {
	AirlineCode  string
	APIKey       string
	FieldMapping CustomFieldMapping
}

// CustomFieldMapping configures which JSON paths map to canonical fields.
// This allows a single adapter to serve multiple airlines without code changes.
type CustomFieldMapping struct {
	EventID            string `json:"event_id"`
	EventType          string `json:"event_type"`
	FlightNumber       string `json:"flight_number"`
	Origin             string `json:"origin"`
	Destination        string `json:"destination"`
	ScheduledDeparture string `json:"scheduled_departure"`
	ActualDeparture    string `json:"actual_departure"`
	Status             string `json:"status"`
	Reason             string `json:"reason"`
	DelayMinutes       string `json:"delay_minutes"`
	AircraftType       string `json:"aircraft_type"`
	Timestamp          string `json:"timestamp"`
}

// DefaultTHYMapping is the field mapping for Turkish Airlines (THY) custom API.
var DefaultTHYMapping = CustomFieldMapping{
	EventID:            "evtId",
	EventType:          "evtType",
	FlightNumber:       "fltNo",
	Origin:             "depAirport",
	Destination:        "arrAirport",
	ScheduledDeparture: "schedDep",
	ActualDeparture:    "estDep",
	Status:             "fltStat",
	Reason:             "delayReason",
	DelayMinutes:       "delayMins",
	AircraftType:       "acType",
	Timestamp:          "ts",
}

// DefaultPegasusMapping is the field mapping for Pegasus Airlines custom API.
var DefaultPegasusMapping = CustomFieldMapping{
	EventID:            "id",
	EventType:          "type",
	FlightNumber:       "flight",
	Origin:             "from",
	Destination:        "to",
	ScheduledDeparture: "std",
	ActualDeparture:    "etd",
	Status:             "status",
	Reason:             "reason",
	DelayMinutes:       "delay",
	AircraftType:       "aircraft",
	Timestamp:          "time",
}

func NewCustomAdapter(airlineCode, apiKey string, mapping CustomFieldMapping) *CustomAdapter {
	return &CustomAdapter{AirlineCode: airlineCode, APIKey: apiKey, FieldMapping: mapping}
}

func (c *CustomAdapter) Source() Source { return SourceCustom }

func (c *CustomAdapter) ParseFlightEvent(ctx context.Context, raw RawPSSEvent) (*models.FlightEvent, error) {
	var payload map[string]interface{}
	if err := json.Unmarshal(raw.Payload, &payload); err != nil {
		return nil, fmt.Errorf("custom adapter unmarshal: %w", err)
	}

	getString := func(key string) string {
		if v, ok := payload[key]; ok {
			return fmt.Sprintf("%v", v)
		}
		return ""
	}
	getInt := func(key string) int {
		if v, ok := payload[key]; ok {
			switch val := v.(type) {
			case float64:
				return int(val)
			}
		}
		return 0
	}
	parseTime := func(key string) time.Time {
		s := getString(key)
		if s == "" {
			return time.Time{}
		}
		for _, layout := range []string{time.RFC3339, "2006-01-02T15:04:05", "2006-01-02 15:04:05"} {
			if t, err := time.Parse(layout, s); err == nil {
				return t
			}
		}
		return time.Time{}
	}

	sched := parseTime(c.FieldMapping.ScheduledDeparture)
	if sched.IsZero() {
		return nil, fmt.Errorf("custom adapter: missing scheduled departure")
	}

	ts := parseTime(c.FieldMapping.Timestamp)
	if ts.IsZero() {
		ts = raw.ReceivedAt
	}

	rawStatus := getString(c.FieldMapping.Status)
	eventType := mapCustomStatus(rawStatus)

	return &models.FlightEvent{
		EventID:            getString(c.FieldMapping.EventID),
		EventType:          eventType,
		FlightNumber:       getString(c.FieldMapping.FlightNumber),
		Origin:             getString(c.FieldMapping.Origin),
		Destination:        getString(c.FieldMapping.Destination),
		ScheduledDeparture: sched,
		ActualDeparture:    parseTime(c.FieldMapping.ActualDeparture),
		Status:             eventType,
		Reason:             getString(c.FieldMapping.Reason),
		DelayMinutes:       getInt(c.FieldMapping.DelayMinutes),
		AircraftType:       getString(c.FieldMapping.AircraftType),
		Timestamp:          ts,
	}, nil
}

func (c *CustomAdapter) ParsePassengerProfile(ctx context.Context, raw RawPSSEvent) (*models.PassengerProfile, error) {
	// Custom airlines use a simple flat JSON for passenger data
	var p struct {
		PNR         string   `json:"pnr"`
		FirstName   string   `json:"firstName"`
		LastName    string   `json:"lastName"`
		Email       string   `json:"email"`
		Phone       string   `json:"phone"`
		Ticket      string   `json:"ticketNo"`
		Class       string   `json:"class"`
		FFPTier     string   `json:"ffpTier"`
		FFPID       string   `json:"ffpId"`
		Seat        string   `json:"seat"`
		SSR         []string `json:"ssr"`
		CheckedIn   bool     `json:"checkedIn"`
		Bags        int      `json:"bags"`
		Nationality string   `json:"nationality"`
		BookingRef  string   `json:"bookingRef"`
		FlightNum   string   `json:"flightNum"`
		RecordID    string   `json:"recordId"`
	}
	if err := json.Unmarshal(raw.Payload, &p); err != nil {
		return nil, fmt.Errorf("custom passenger unmarshal: %w", err)
	}
	return &models.PassengerProfile{
		PNR:             p.PNR,
		FirstName:       p.FirstName,
		LastName:        p.LastName,
		Email:           p.Email,
		Phone:           p.Phone,
		TicketNumber:    p.Ticket,
		TicketClass:     mapCustomClass(p.Class),
		LoyaltyTier:     p.FFPTier,
		LoyaltyID:       p.FFPID,
		SeatNumber:      p.Seat,
		SpecialNeeds:    p.SSR,
		FlightNumber:    p.FlightNum,
		BookingRef:      p.BookingRef,
		CheckedIn:       p.CheckedIn,
		BaggageCount:    p.Bags,
		Nationality:     p.Nationality,
		PSS:             string(SourceCustom) + ":" + c.AirlineCode,
		RawPSSReference: p.RecordID,
	}, nil
}

func (c *CustomAdapter) ValidateWebhookSignature(headers map[string]string, body []byte) bool {
	return headers["X-API-Key"] == c.APIKey
}

func mapCustomStatus(s string) string {
	switch strings.ToUpper(s) {
	case "CANCEL", "CANCELLED", "CNX":
		return "CANCELLATION"
	case "DELAY", "DELAYED", "DLY":
		return "DELAY"
	case "DIVERT", "DIVERTED", "DIV":
		return "DIVERSION"
	case "GATE", "GATE_CHANGE", "GCH":
		return "GATE_CHANGE"
	default:
		return "DELAY"
	}
}

func mapCustomClass(c string) string {
	switch strings.ToUpper(c) {
	case "F", "FIRST", "C1":
		return "FIRST"
	case "C", "J", "BUSINESS", "BIZ":
		return "BUSINESS"
	default:
		return "ECONOMY"
	}
}
