package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/segmentio/kafka-go"
)

type FlightEvent struct {
	EventID            string    `json:"event_id" binding:"required"`
	EventType          string    `json:"event_type" binding:"required"` // CANCELLATION, DELAY, DIVERSION
	FlightNumber       string    `json:"flight_number" binding:"required"`
	Origin             string    `json:"origin" binding:"required"`
	Destination        string    `json:"destination" binding:"required"`
	ScheduledDeparture time.Time `json:"scheduled_departure" binding:"required"`
	Reason             string    `json:"reason" binding:"required"`
	Timestamp          time.Time `json:"timestamp"`
}

var kafkaWriter *kafka.Writer

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8002"
	}

	kafkaBrokers := os.Getenv("KAFKA_BOOTSTRAP_SERVERS")
	if kafkaBrokers == "" {
		kafkaBrokers = "localhost:9092"
	}

	// Initialize Kafka Writer
	kafkaWriter = &kafka.Writer{
		Addr:     kafka.TCP(kafkaBrokers),
		Topic:    "flight-events",
		Balancer: &kafka.LeastBytes{},
	}
	defer kafkaWriter.Close()

	r := gin.Default()

	// API Auth middleware
	apiKey := os.Getenv("API_KEY")
	if apiKey == "" {
		apiKey = "aero-agent-api-key-dev"
	}

	authMiddleware := func(c *gin.Context) {
		token := c.GetHeader("X-API-Key")
		if token != apiKey {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized API Access"})
			c.Abort()
			return
		}
		c.Next()
	}

	// Routes
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":      "healthy",
			"microservice": "Aero-Agent Ingestion (Go)",
		})
	})

	r.POST("/webhook/flight-event", authMiddleware, handleFlightEvent)

	// Graceful shutdown
	srv := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}

	go func() {
		log.Printf("Ingestion Webhook Service starting on port %s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down Ingestion Webhook Service...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server Shutdown forced:", err)
	}

	log.Println("Ingestion Service exited cleanly.")
}

func handleFlightEvent(c *gin.Context) {
	var event FlightEvent
	if err := c.ShouldBindJSON(&event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now()
	}

	// Serialize event to JSON
	payload, err := json.Marshal(event)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to marshal flight event"})
		return
	}

	// Publish to Apache Kafka
	err = kafkaWriter.WriteMessages(context.Background(),
		kafka.Message{
			Key:   []byte(event.FlightNumber),
			Value: payload,
		},
	)

	if err != nil {
		log.Printf("Error publishing to Kafka: %v", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Message Broker Offline", "details": err.Error()})
		return
	}

	log.Printf("Flight crisis event ingested for flight %s: %s", event.FlightNumber, event.Reason)
	c.JSON(http.StatusAccepted, gin.H{
		"message": "Flight event accepted and queued for decision processing.",
		"event_id": event.EventID,
	})
}
