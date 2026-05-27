package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/aero-agent/ingestion-service/internal/models"
	"github.com/aero-agent/ingestion-service/internal/queue"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const (
	kafkaTopic     = "flight-events"
	publishTimeout = 5 * time.Second
)

// WebhookHandler handles incoming flight event webhooks.
type WebhookHandler struct {
	producer *queue.KafkaProducer
}

// NewWebhookHandler creates a new WebhookHandler with the given Kafka producer.
func NewWebhookHandler(producer *queue.KafkaProducer) *WebhookHandler {
	return &WebhookHandler{producer: producer}
}

// FlightEventHandler receives a flight event, validates it, and publishes to Kafka.
func (h *WebhookHandler) FlightEventHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		var event models.FlightEvent

		if err := c.ShouldBindJSON(&event); err != nil {
			log.Printf("[Webhook] Validation error: %v", err)
			c.JSON(http.StatusBadRequest, models.ErrorResponse{
				Error:   "invalid_payload",
				Details: err.Error(),
			})
			return
		}

		// Generate event ID if not provided
		if event.EventID == "" {
			event.EventID = uuid.New().String()
		}

		// Ensure timestamp is set
		if event.Timestamp.IsZero() {
			event.Timestamp = time.Now().UTC()
		}

		// Serialize event to JSON
		payload, err := json.Marshal(event)
		if err != nil {
			log.Printf("[Webhook] JSON marshal error: %v", err)
			c.JSON(http.StatusInternalServerError, models.ErrorResponse{
				Error:   "serialization_error",
				Details: "failed to serialize event",
			})
			return
		}

		// Publish to Kafka with timeout
		ctx, cancel := context.WithTimeout(c.Request.Context(), publishTimeout)
		defer cancel()

		if err := h.producer.Publish(ctx, kafkaTopic, event.FlightNumber, payload); err != nil {
			log.Printf("[Webhook] Kafka publish error: %v", err)
			c.JSON(http.StatusServiceUnavailable, models.ErrorResponse{
				Error:   "publish_error",
				Details: "failed to queue event for processing",
			})
			return
		}

		log.Printf("[Webhook] Accepted event: id=%s type=%s flight=%s",
			event.EventID, event.EventType, event.FlightNumber)

		c.JSON(http.StatusAccepted, models.FlightEventResponse{
			Status:  "accepted",
			EventID: event.EventID,
			Message: "flight event queued for processing",
		})
	}
}
