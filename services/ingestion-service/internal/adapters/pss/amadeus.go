package pss

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/aero-agent/ingestion-service/internal/models"
)

// AmadeusAdapter handles Amadeus Altéa payloads delivered via IATA NDC or EDIFACT.
// In production this would call the Amadeus REST/SOAP gateway; here we parse
// the normalized NDC JSON envelope that the Altéa gateway emits.
type AmadeusAdapter struct {
	SharedSecret string
}

func NewAmadeusAdapter(secret string) *AmadeusAdapter {
	return &AmadeusAdapter{SharedSecret: secret}
}

func (a *AmadeusAdapter) Source() Source { return SourceAmadeus }

// ndcFlightEvent is the Amadeus Altéa NDC wire format for flight disruption notifications.
type ndcFlightEvent struct {
	EventID       string `json:"EventID"`
	EventType     string `json:"EventType"`    // OA (OperationalAlert), FD (Flight Disruption)
	FlightDesig   struct {
		CarrierCode  string `json:"CarrierCode"`
		FlightNumber string `json:"FlightNumber"`
		DepartureDate string `json:"DepartureDate"` // YYYY-MM-DD
	} `json:"FlightDesignator"`
	Departure struct {
		IATA              string `json:"AirportCode"`
		ScheduledTime     string `json:"ScheduledTime"`     // ISO8601
		EstimatedTime     string `json:"EstimatedTime"`
	} `json:"Departure"`
	Arrival struct {
		IATA string `json:"AirportCode"`
	} `json:"Arrival"`
	DisruptionInfo struct {
		ReasonCode  string `json:"ReasonCode"`  // IATA delay codes (01-99)
		Description string `json:"Description"`
		DelayMins   int    `json:"DelayMinutes"`
		NewStatus   string `json:"NewStatus"`   // CANCELLED, DELAYED, DIVERTED
	} `json:"DisruptionInfo"`
	AircraftType string `json:"AircraftType"`
	Timestamp    string `json:"Timestamp"`
}

func (a *AmadeusAdapter) ParseFlightEvent(ctx context.Context, raw RawPSSEvent) (*models.FlightEvent, error) {
	var ndc ndcFlightEvent
	if err := json.Unmarshal(raw.Payload, &ndc); err != nil {
		return nil, fmt.Errorf("amadeus NDC unmarshal: %w", err)
	}

	sched, err := time.Parse(time.RFC3339, ndc.Departure.ScheduledTime)
	if err != nil {
		return nil, fmt.Errorf("amadeus scheduled time parse: %w", err)
	}
	var actual time.Time
	if ndc.Departure.EstimatedTime != "" {
		actual, _ = time.Parse(time.RFC3339, ndc.Departure.EstimatedTime)
	}
	ts, _ := time.Parse(time.RFC3339, ndc.Timestamp)
	if ts.IsZero() {
		ts = raw.ReceivedAt
	}

	eventType := mapAmadeusStatus(ndc.DisruptionInfo.NewStatus)

	return &models.FlightEvent{
		EventID:            ndc.EventID,
		EventType:          eventType,
		FlightNumber:       ndc.FlightDesig.CarrierCode + ndc.FlightDesig.FlightNumber,
		Origin:             ndc.Departure.IATA,
		Destination:        ndc.Arrival.IATA,
		ScheduledDeparture: sched,
		ActualDeparture:    actual,
		Status:             mapAmadeusStatus(ndc.DisruptionInfo.NewStatus),
		Reason:             ndc.DisruptionInfo.Description,
		DelayMinutes:       ndc.DisruptionInfo.DelayMins,
		AircraftType:       ndc.AircraftType,
		Timestamp:          ts,
	}, nil
}

type ndcPassenger struct {
	PNR        string `json:"PNR"`
	GivenName  string `json:"GivenName"`
	Surname    string `json:"Surname"`
	Email      string `json:"Email"`
	Phone      string `json:"Phone"`
	Ticket     string `json:"TicketNumber"`
	Class      string `json:"CabinClass"`
	FFP        struct {
		Tier   string `json:"TierLevel"`
		Number string `json:"MemberID"`
	} `json:"FrequentFlyer"`
	Seat         string   `json:"SeatNumber"`
	SpecialNeeds []string `json:"SSRCodes"`
	CheckedIn    bool     `json:"CheckedIn"`
	Bags         int      `json:"CheckedBagCount"`
	Nationality  string   `json:"Nationality"`
	BookingRef   string   `json:"BookingReference"`
	FlightNumber string   `json:"FlightNumber"`
	RecordLocator string  `json:"RecordLocator"`
}

func (a *AmadeusAdapter) ParsePassengerProfile(ctx context.Context, raw RawPSSEvent) (*models.PassengerProfile, error) {
	var p ndcPassenger
	if err := json.Unmarshal(raw.Payload, &p); err != nil {
		return nil, fmt.Errorf("amadeus passenger unmarshal: %w", err)
	}
	return &models.PassengerProfile{
		PNR:             p.PNR,
		FirstName:       p.GivenName,
		LastName:        p.Surname,
		Email:           p.Email,
		Phone:           p.Phone,
		TicketNumber:    p.Ticket,
		TicketClass:     mapAmadeusClass(p.Class),
		LoyaltyTier:     p.FFP.Tier,
		LoyaltyID:       p.FFP.Number,
		SeatNumber:      p.Seat,
		SpecialNeeds:    p.SpecialNeeds,
		FlightNumber:    p.FlightNumber,
		BookingRef:      p.BookingRef,
		CheckedIn:       p.CheckedIn,
		BaggageCount:    p.Bags,
		Nationality:     p.Nationality,
		PSS:             string(SourceAmadeus),
		RawPSSReference: p.RecordLocator,
	}, nil
}

func (a *AmadeusAdapter) ValidateWebhookSignature(headers map[string]string, body []byte) bool {
	sig, ok := headers["X-Amadeus-Signature"]
	if !ok {
		return false
	}
	mac := hmac.New(sha256.New, []byte(a.SharedSecret))
	mac.Write(body)
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(sig), []byte(expected))
}

func mapAmadeusStatus(s string) string {
	switch strings.ToUpper(s) {
	case "CANCELLED":
		return "CANCELLATION"
	case "DELAYED":
		return "DELAY"
	case "DIVERTED":
		return "DIVERSION"
	case "GATE_CHANGE":
		return "GATE_CHANGE"
	default:
		return "DELAY"
	}
}

func mapAmadeusClass(c string) string {
	switch strings.ToUpper(c) {
	case "F", "FIRST":
		return "FIRST"
	case "C", "J", "BUSINESS":
		return "BUSINESS"
	default:
		return "ECONOMY"
	}
}
