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

// SabreAdapter handles Sabre / Navitaire REST API payloads.
// Sabre delivers disruption notifications via the Sabre Dev Studio
// Disruption Management API (JSON/REST).
type SabreAdapter struct {
	SharedSecret string
}

func NewSabreAdapter(secret string) *SabreAdapter {
	return &SabreAdapter{SharedSecret: secret}
}

func (s *SabreAdapter) Source() Source { return SourceSabre }

type sabreFlightNotification struct {
	NotificationID string `json:"notificationId"`
	EventType      string `json:"eventType"` // FLIGHT_CANCELLED, FLIGHT_DELAYED, FLIGHT_DIVERTED
	Flight         struct {
		MarketingCarrier string `json:"marketingCarrierCode"`
		FlightNumber     string `json:"flightNumber"`
		DepartureStation string `json:"departureStation"`
		ArrivalStation   string `json:"arrivalStation"`
		ScheduledDepart  string `json:"scheduledDepartureDateTime"` // ISO8601
		EstimatedDepart  string `json:"estimatedDepartureDateTime"`
		DelayMinutes     int    `json:"delayMinutes"`
		CancelledFlag    bool   `json:"cancelledFlag"`
		AircraftType     string `json:"aircraftTypeCode"`
		DisruptionReason string `json:"disruptionReason"`
	} `json:"flight"`
	CreatedAt string `json:"createdAt"`
}

func (s *SabreAdapter) ParseFlightEvent(ctx context.Context, raw RawPSSEvent) (*models.FlightEvent, error) {
	var n sabreFlightNotification
	if err := json.Unmarshal(raw.Payload, &n); err != nil {
		return nil, fmt.Errorf("sabre unmarshal: %w", err)
	}

	sched, err := time.Parse(time.RFC3339, n.Flight.ScheduledDepart)
	if err != nil {
		return nil, fmt.Errorf("sabre scheduled time: %w", err)
	}
	var actual time.Time
	if n.Flight.EstimatedDepart != "" {
		actual, _ = time.Parse(time.RFC3339, n.Flight.EstimatedDepart)
	}
	ts, _ := time.Parse(time.RFC3339, n.CreatedAt)
	if ts.IsZero() {
		ts = raw.ReceivedAt
	}

	eventType := mapSabreEventType(n.EventType)
	status := eventType

	return &models.FlightEvent{
		EventID:            n.NotificationID,
		EventType:          eventType,
		FlightNumber:       n.Flight.MarketingCarrier + n.Flight.FlightNumber,
		Origin:             n.Flight.DepartureStation,
		Destination:        n.Flight.ArrivalStation,
		ScheduledDeparture: sched,
		ActualDeparture:    actual,
		Status:             status,
		Reason:             n.Flight.DisruptionReason,
		DelayMinutes:       n.Flight.DelayMinutes,
		AircraftType:       n.Flight.AircraftType,
		Timestamp:          ts,
	}, nil
}

type sabrePassenger struct {
	RecordLocator string `json:"recordLocator"`
	GivenName     string `json:"givenName"`
	Surname       string `json:"surname"`
	Email         string `json:"email"`
	Phone         string `json:"phone"`
	TicketNumber  string `json:"eTicketNumber"`
	CabinCode     string `json:"cabinCode"` // Y, C, F
	FreqFlyer     struct {
		Carrier string `json:"carrier"`
		Number  string `json:"number"`
		Tier    string `json:"tier"`
	} `json:"frequentFlyerInfo"`
	Seat        string   `json:"seatAssignment"`
	SSR         []string `json:"ssrCodes"`
	CheckedIn   bool     `json:"checkedInFlag"`
	BagCount    int      `json:"checkedBagCount"`
	Nationality string   `json:"nationalityCode"`
	BookingRef  string   `json:"bookingReference"`
	FlightNum   string   `json:"flightNumber"`
}

func (s *SabreAdapter) ParsePassengerProfile(ctx context.Context, raw RawPSSEvent) (*models.PassengerProfile, error) {
	var p sabrePassenger
	if err := json.Unmarshal(raw.Payload, &p); err != nil {
		return nil, fmt.Errorf("sabre passenger unmarshal: %w", err)
	}
	return &models.PassengerProfile{
		PNR:             p.RecordLocator,
		FirstName:       p.GivenName,
		LastName:        p.Surname,
		Email:           p.Email,
		Phone:           p.Phone,
		TicketNumber:    p.TicketNumber,
		TicketClass:     mapSabreClass(p.CabinCode),
		LoyaltyTier:     p.FreqFlyer.Tier,
		LoyaltyID:       p.FreqFlyer.Number,
		SeatNumber:      p.Seat,
		SpecialNeeds:    p.SSR,
		FlightNumber:    p.FlightNum,
		BookingRef:      p.BookingRef,
		CheckedIn:       p.CheckedIn,
		BaggageCount:    p.BagCount,
		Nationality:     p.Nationality,
		PSS:             string(SourceSabre),
		RawPSSReference: p.RecordLocator,
	}, nil
}

func (s *SabreAdapter) ValidateWebhookSignature(headers map[string]string, body []byte) bool {
	sig, ok := headers["X-Sabre-Signature"]
	if !ok {
		return false
	}
	mac := hmac.New(sha256.New, []byte(s.SharedSecret))
	mac.Write(body)
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(sig), []byte(expected))
}

func mapSabreEventType(t string) string {
	switch strings.ToUpper(t) {
	case "FLIGHT_CANCELLED":
		return "CANCELLATION"
	case "FLIGHT_DELAYED":
		return "DELAY"
	case "FLIGHT_DIVERTED":
		return "DIVERSION"
	case "GATE_CHANGE":
		return "GATE_CHANGE"
	default:
		return "DELAY"
	}
}

func mapSabreClass(c string) string {
	switch strings.ToUpper(c) {
	case "F":
		return "FIRST"
	case "C", "J":
		return "BUSINESS"
	default:
		return "ECONOMY"
	}
}
