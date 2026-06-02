package handlers

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/aero-agent/ingestion-service/internal/adapters"
	"github.com/aero-agent/ingestion-service/internal/adapters/pss"
	"github.com/aero-agent/ingestion-service/internal/models"
	"github.com/aero-agent/ingestion-service/internal/queue"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const pssKafkaTopic = "flight-events"

// PSSWebhookHandler receives events from all registered PSS systems,
// normalizes them through the adapter layer, and publishes to Kafka.
type PSSWebhookHandler struct {
	normalizer *adapters.Normalizer
	producer   *queue.KafkaProducer
}

func NewPSSWebhookHandler(n *adapters.Normalizer, p *queue.KafkaProducer) *PSSWebhookHandler {
	return &PSSWebhookHandler{normalizer: n, producer: p}
}

// HandlePSSFlightEvent is the unified endpoint for all PSS flight-event webhooks.
// The PSS source is identified by the X-PSS-Source header.
func (h *PSSWebhookHandler) HandlePSSFlightEvent() gin.HandlerFunc {
	return func(c *gin.Context) {
		sourceHeader := c.GetHeader("X-PSS-Source")
		if sourceHeader == "" {
			c.JSON(http.StatusBadRequest, models.ErrorResponse{
				Error:   "missing_pss_source",
				Details: "X-PSS-Source header is required (AMADEUS, SABRE, SITA, CUSTOM)",
			})
			return
		}

		body, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, models.ErrorResponse{
				Error: "body_read_error", Details: err.Error(),
			})
			return
		}

		// Collect all headers for signature validation
		headers := make(map[string]string)
		for k, v := range c.Request.Header {
			if len(v) > 0 {
				headers[k] = v[0]
			}
		}

		source := pss.Source(sourceHeader)

		// Validate signature per PSS system
		if !h.normalizer.ValidateSignature(source, headers, body) {
			c.JSON(http.StatusUnauthorized, models.ErrorResponse{
				Error:   "invalid_signature",
				Details: "webhook signature verification failed",
			})
			return
		}

		raw := pss.RawPSSEvent{
			Source:      source,
			AirlineCode: c.GetHeader("X-Airline-Code"),
			ReceivedAt:  time.Now().UTC(),
			Format:      c.GetHeader("X-PSS-Format"),
			Payload:     body,
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		event, err := h.normalizer.NormalizeFlightEvent(ctx, raw)
		if err != nil {
			log.Printf("[PSS] Normalization error source=%s: %v", source, err)
			c.JSON(http.StatusUnprocessableEntity, models.ErrorResponse{
				Error: "normalization_error", Details: err.Error(),
			})
			return
		}

		if event.EventID == "" {
			event.EventID = uuid.New().String()
		}

		payload, err := json.Marshal(event)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.ErrorResponse{
				Error: "serialization_error", Details: "failed to serialize normalized event",
			})
			return
		}

		if err := h.producer.Publish(ctx, pssKafkaTopic, event.FlightNumber, payload); err != nil {
			log.Printf("[PSS] Kafka publish error: %v", err)
			c.JSON(http.StatusServiceUnavailable, models.ErrorResponse{
				Error: "publish_error", Details: "failed to queue event",
			})
			return
		}

		log.Printf("[PSS] Accepted event: source=%s id=%s type=%s flight=%s",
			source, event.EventID, event.EventType, event.FlightNumber)

		c.JSON(http.StatusAccepted, models.FlightEventResponse{
			Status:  "accepted",
			EventID: event.EventID,
			Message: "PSS event normalized and queued for decision processing",
		})
	}
}

// HandlePSSPassengerProfile receives passenger data from PSS systems.
func (h *PSSWebhookHandler) HandlePSSPassengerProfile() gin.HandlerFunc {
	return func(c *gin.Context) {
		sourceHeader := c.GetHeader("X-PSS-Source")
		if sourceHeader == "" {
			c.JSON(http.StatusBadRequest, models.ErrorResponse{
				Error: "missing_pss_source",
			})
			return
		}

		body, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, models.ErrorResponse{
				Error: "body_read_error", Details: err.Error(),
			})
			return
		}

		headers := make(map[string]string)
		for k, v := range c.Request.Header {
			if len(v) > 0 {
				headers[k] = v[0]
			}
		}

		source := pss.Source(sourceHeader)
		if !h.normalizer.ValidateSignature(source, headers, body) {
			c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "invalid_signature"})
			return
		}

		raw := pss.RawPSSEvent{
			Source:     source,
			ReceivedAt: time.Now().UTC(),
			Payload:    body,
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		profile, err := h.normalizer.NormalizePassengerProfile(ctx, raw)
		if err != nil {
			c.JSON(http.StatusUnprocessableEntity, models.ErrorResponse{
				Error: "normalization_error", Details: err.Error(),
			})
			return
		}

		payload, _ := json.Marshal(profile)
		if err := h.producer.Publish(ctx, "passenger-profiles", profile.PNR, payload); err != nil {
			c.JSON(http.StatusServiceUnavailable, models.ErrorResponse{
				Error: "publish_error", Details: err.Error(),
			})
			return
		}

		c.JSON(http.StatusAccepted, models.PassengerProfileResponse{
			Status:  "accepted",
			Profile: *profile,
		})
	}
}
