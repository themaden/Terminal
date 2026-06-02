package pss

import (
	"context"
	"time"

	"github.com/aero-agent/ingestion-service/internal/models"
)

// Source identifies which PSS system produced an event.
type Source string

const (
	SourceAmadeus Source = "AMADEUS"
	SourceSabre   Source = "SABRE"
	SourceSITA    Source = "SITA"
	SourceCustom  Source = "CUSTOM"
)

// RawPSSEvent is the envelope that every PSS adapter must produce before
// normalization. It carries the wire-format payload alongside its metadata.
type RawPSSEvent struct {
	Source      Source
	AirlineCode string
	ReceivedAt  time.Time
	Format      string // "NDC", "EDIFACT", "REST", "SITA", "CUSTOM"
	Payload     []byte
}

// Adapter is the contract that each PSS system adapter must satisfy.
// The core AI only consumes normalized models — adapters are the
// translation boundary between airline-specific wire formats and
// the canonical FlightEvent / PassengerProfile structures.
type Adapter interface {
	// Source returns the PSS identifier this adapter handles.
	Source() Source

	// ParseFlightEvent decodes a raw PSS payload into the canonical FlightEvent.
	ParseFlightEvent(ctx context.Context, raw RawPSSEvent) (*models.FlightEvent, error)

	// ParsePassengerProfile decodes passenger data into the canonical PassengerProfile.
	ParsePassengerProfile(ctx context.Context, raw RawPSSEvent) (*models.PassengerProfile, error)

	// ValidateWebhookSignature verifies the authenticity of an incoming PSS call.
	ValidateWebhookSignature(headers map[string]string, body []byte) bool
}
