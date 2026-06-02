package adapters

import (
	"context"
	"fmt"

	"github.com/aero-agent/ingestion-service/internal/adapters/pss"
	"github.com/aero-agent/ingestion-service/internal/models"
)

// Normalizer routes a RawPSSEvent to the correct adapter and returns
// canonical models. The core AI only receives output from here.
type Normalizer struct {
	adapters map[pss.Source]pss.Adapter
}

func NewNormalizer(adapters ...pss.Adapter) *Normalizer {
	n := &Normalizer{adapters: make(map[pss.Source]pss.Adapter)}
	for _, a := range adapters {
		n.adapters[a.Source()] = a
	}
	return n
}

func (n *Normalizer) NormalizeFlightEvent(ctx context.Context, raw pss.RawPSSEvent) (*models.FlightEvent, error) {
	a, ok := n.adapters[raw.Source]
	if !ok {
		return nil, fmt.Errorf("normalizer: no adapter registered for source %s", raw.Source)
	}
	return a.ParseFlightEvent(ctx, raw)
}

func (n *Normalizer) NormalizePassengerProfile(ctx context.Context, raw pss.RawPSSEvent) (*models.PassengerProfile, error) {
	a, ok := n.adapters[raw.Source]
	if !ok {
		return nil, fmt.Errorf("normalizer: no adapter registered for source %s", raw.Source)
	}
	return a.ParsePassengerProfile(ctx, raw)
}

func (n *Normalizer) ValidateSignature(source pss.Source, headers map[string]string, body []byte) bool {
	a, ok := n.adapters[source]
	if !ok {
		return false
	}
	return a.ValidateWebhookSignature(headers, body)
}
