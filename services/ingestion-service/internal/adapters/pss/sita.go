package pss

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/aero-agent/ingestion-service/internal/models"
)

// SITAAdapter handles SITA / IBS payloads.
// SITA's DCS (Departure Control System) delivers check-in, baggage, and
// boarding gate events via the SITA Airport Management API.
type SITAAdapter struct {
	APIToken string
}

func NewSITAAdapter(token string) *SITAAdapter {
	return &SITAAdapter{APIToken: token}
}

func (s *SITAAdapter) Source() Source { return SourceSITA }

type sitaFlightMessage struct {
	MsgID   string `json:"MessageId"`
	MsgType string `json:"MessageType"` // FLIGHT_UPDATE, GATE_CHANGE, CANCEL
	Flight  struct {
		IATA         string `json:"IataCode"`
		Number       string `json:"FlightNumber"`
		Origin       string `json:"OriginAirport"`
		Destination  string `json:"DestAirport"`
		ScheduledSTD string `json:"ScheduledSTD"` // YYYY-MM-DDTHH:MM:SSZ
		ActualSTD    string `json:"ActualSTD"`
		Status       string `json:"FlightStatus"` // ONTIME, DELAYED, CANCELLED, DIVERTED
		DelayMins    int    `json:"DelayMinutes"`
		AircraftReg  string `json:"AircraftRegistration"`
		AircraftType string `json:"AircraftType"`
		Reason       string `json:"DelayReason"` // IATA delay code description
	} `json:"FlightInfo"`
	Timestamp string `json:"Timestamp"`
}

func (s *SITAAdapter) ParseFlightEvent(ctx context.Context, raw RawPSSEvent) (*models.FlightEvent, error) {
	var msg sitaFlightMessage
	if err := json.Unmarshal(raw.Payload, &msg); err != nil {
		return nil, fmt.Errorf("sita unmarshal: %w", err)
	}

	sched, err := time.Parse(time.RFC3339, msg.Flight.ScheduledSTD)
	if err != nil {
		return nil, fmt.Errorf("sita scheduled time: %w", err)
	}
	var actual time.Time
	if msg.Flight.ActualSTD != "" {
		actual, _ = time.Parse(time.RFC3339, msg.Flight.ActualSTD)
	}
	ts, _ := time.Parse(time.RFC3339, msg.Timestamp)
	if ts.IsZero() {
		ts = raw.ReceivedAt
	}

	eventType := mapSITAStatus(msg.Flight.Status)

	return &models.FlightEvent{
		EventID:            msg.MsgID,
		EventType:          eventType,
		FlightNumber:       msg.Flight.IATA + msg.Flight.Number,
		Origin:             msg.Flight.Origin,
		Destination:        msg.Flight.Destination,
		ScheduledDeparture: sched,
		ActualDeparture:    actual,
		Status:             eventType,
		Reason:             msg.Flight.Reason,
		DelayMinutes:       msg.Flight.DelayMins,
		AircraftType:       msg.Flight.AircraftType,
		Timestamp:          ts,
	}, nil
}

type sitaPassenger struct {
	RecordID    string   `json:"RecordId"`
	GivenName   string   `json:"GivenName"`
	FamilyName  string   `json:"FamilyName"`
	Email       string   `json:"EmailAddress"`
	Mobile      string   `json:"MobileNumber"`
	TicketNo    string   `json:"TicketNumber"`
	Cabin       string   `json:"CabinClass"` // ECO, BUS, FIRST
	FQTV        string   `json:"FrequentFlyerNumber"`
	FQTVTier    string   `json:"FrequentFlyerTier"`
	SeatNo      string   `json:"SeatNumber"`
	SSRs        []string `json:"SpecialServiceRequests"`
	CheckedIn   bool     `json:"CheckedIn"`
	BagTags     []string `json:"BaggageTags"`
	Nationality string   `json:"NationalityCode"`
	BookingRef  string   `json:"BookingReference"`
	FlightNum   string   `json:"FlightNumber"`
}

func (s *SITAAdapter) ParsePassengerProfile(ctx context.Context, raw RawPSSEvent) (*models.PassengerProfile, error) {
	var p sitaPassenger
	if err := json.Unmarshal(raw.Payload, &p); err != nil {
		return nil, fmt.Errorf("sita passenger unmarshal: %w", err)
	}
	return &models.PassengerProfile{
		PNR:             p.BookingRef,
		FirstName:       p.GivenName,
		LastName:        p.FamilyName,
		Email:           p.Email,
		Phone:           p.Mobile,
		TicketNumber:    p.TicketNo,
		TicketClass:     mapSITAClass(p.Cabin),
		LoyaltyTier:     p.FQTVTier,
		LoyaltyID:       p.FQTV,
		SeatNumber:      p.SeatNo,
		SpecialNeeds:    p.SSRs,
		FlightNumber:    p.FlightNum,
		BookingRef:      p.BookingRef,
		CheckedIn:       p.CheckedIn,
		BaggageCount:    len(p.BagTags),
		Nationality:     p.Nationality,
		PSS:             string(SourceSITA),
		RawPSSReference: p.RecordID,
	}, nil
}

// SITA uses API token in Authorization header — no signature verification needed.
func (s *SITAAdapter) ValidateWebhookSignature(headers map[string]string, body []byte) bool {
	auth := headers["Authorization"]
	return strings.TrimPrefix(auth, "Bearer ") == s.APIToken
}

func mapSITAStatus(st string) string {
	switch strings.ToUpper(st) {
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

func mapSITAClass(c string) string {
	switch strings.ToUpper(c) {
	case "FIRST", "F":
		return "FIRST"
	case "BUS", "BUSINESS", "C", "J":
		return "BUSINESS"
	default:
		return "ECONOMY"
	}
}
