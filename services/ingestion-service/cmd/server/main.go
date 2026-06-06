package main

import (
	"bytes"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	kafka "github.com/segmentio/kafka-go"
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

var (
	kafkaWriter        *kafka.Writer
	kafkaEnabled       bool
	decisionEngineURL  string
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8002"
	}

	decisionEngineURL = os.Getenv("DECISION_ENGINE_URL")
	if decisionEngineURL == "" {
		decisionEngineURL = "http://localhost:8000"
	}

	kafkaBrokers := os.Getenv("KAFKA_BOOTSTRAP_SERVERS")
	if kafkaBrokers == "" {
		kafkaBrokers = "localhost:9092"
	}

	// Kafka bağlantısını dene — başarısız olursa HTTP fallback devreye girer
	kafkaWriter = &kafka.Writer{
		Addr:         kafka.TCP(kafkaBrokers),
		Topic:        "flight-events",
		Balancer:     &kafka.LeastBytes{},
		MaxAttempts:  1,
		WriteTimeout: 2 * time.Second,
	}
	kafkaEnabled = checkKafkaConnection(kafkaBrokers)
	if kafkaEnabled {
		log.Printf("Kafka connected: %s", kafkaBrokers)
		defer kafkaWriter.Close()
	} else {
		log.Printf("Kafka unavailable (%s) — HTTP fallback to decision engine active", kafkaBrokers)
	}

	r := gin.Default()

	apiKey := os.Getenv("API_KEY")
	if apiKey == "" {
		apiKey = "jetnexus-api-key-dev"
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

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":          "healthy",
			"microservice":    "JetNexus AI Ingestion Service (Go)",
			"kafka_enabled":   kafkaEnabled,
			"fallback_target": decisionEngineURL,
		})
	})

	r.POST("/webhook/flight-event", authMiddleware, handleFlightEvent)

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
	log.Println("Shutting down Ingestion Service...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced shutdown:", err)
	}
	log.Println("Ingestion Service exited cleanly.")
}

// checkKafkaConnection — Kafka'nın gerçekten erişilebilir olup olmadığını test eder.
func checkKafkaConnection(broker string) bool {
	conn, err := kafka.DialContext(context.Background(), "tcp", broker)
	if err != nil {
		return false
	}
	conn.Close()
	return true
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

	payload, err := json.Marshal(event)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to marshal event"})
		return
	}

	if kafkaEnabled {
		// Kafka yolu
		err = kafkaWriter.WriteMessages(context.Background(),
			kafka.Message{
				Key:   []byte(event.FlightNumber),
				Value: payload,
			},
		)
		if err != nil {
			log.Printf("Kafka write failed for %s: %v — falling back to HTTP", event.FlightNumber, err)
			kafkaEnabled = false // bir sonraki event'ten itibaren fallback kullan
		}
	}

	if !kafkaEnabled {
		// HTTP fallback — doğrudan Decision Engine API'ye gönder
		if err := forwardToDecisionEngine(event); err != nil {
			log.Printf("HTTP fallback also failed for %s: %v", event.FlightNumber, err)
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error":   "Both Kafka and HTTP fallback unavailable",
				"details": err.Error(),
			})
			return
		}
		log.Printf("Event forwarded via HTTP for flight %s", event.FlightNumber)
	} else {
		log.Printf("Event published to Kafka for flight %s: %s", event.FlightNumber, event.Reason)
	}

	c.JSON(http.StatusAccepted, gin.H{
		"message":  "Flight event accepted and queued for decision processing.",
		"event_id": event.EventID,
		"channel":  map[bool]string{true: "kafka", false: "http_fallback"}[kafkaEnabled],
	})
}

// forwardToDecisionEngine — Kafka yokken event'i HTTP üzerinden iletir.
func forwardToDecisionEngine(event FlightEvent) error {
	url := decisionEngineURL + "/api/v1/crisis/trigger" +
		"?flight_number=" + event.FlightNumber +
		"&crisis_type=" + mapEventType(event.EventType) +
		"&reason=" + event.Reason +
		"&severity=HIGH"

	req, err := http.NewRequestWithContext(
		context.Background(), http.MethodPost, url, bytes.NewBuffer(nil),
	)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return nil
}

// mapEventType — Webhook event tipini kriz tipine dönüştürür.
func mapEventType(eventType string) string {
	switch eventType {
	case "CANCELLATION":
		return "CANCELLATION"
	case "DELAY":
		return "DELAY"
	case "DIVERSION":
		return "DIVERSION"
	default:
		return "DELAY"
	}
}
