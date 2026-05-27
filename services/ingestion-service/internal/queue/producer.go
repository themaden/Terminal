package queue

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/segmentio/kafka-go"
)

// KafkaProducer wraps a kafka-go writer for publishing messages.
type KafkaProducer struct {
	writers map[string]*kafka.Writer
	brokers []string
}

// NewKafkaProducer creates a new KafkaProducer connected to the given brokers.
func NewKafkaProducer(brokers []string) *KafkaProducer {
	return &KafkaProducer{
		writers: make(map[string]*kafka.Writer),
		brokers: brokers,
	}
}

// getWriter returns a writer for the given topic, creating one if needed.
func (p *KafkaProducer) getWriter(topic string) *kafka.Writer {
	if w, ok := p.writers[topic]; ok {
		return w
	}
	w := &kafka.Writer{
		Addr:         kafka.TCP(p.brokers...),
		Topic:        topic,
		Balancer:     &kafka.LeastBytes{},
		BatchTimeout: 10 * time.Millisecond,
		RequiredAcks: kafka.RequireOne,
		MaxAttempts:  3,
		WriteTimeout: 10 * time.Second,
	}
	p.writers[topic] = w
	return w
}

// Publish sends a message to the given Kafka topic.
func (p *KafkaProducer) Publish(ctx context.Context, topic, key string, message []byte) error {
	writer := p.getWriter(topic)

	msg := kafka.Message{
		Key:   []byte(key),
		Value: message,
		Time:  time.Now(),
		Headers: []kafka.Header{
			{Key: "source", Value: []byte("ingestion-service")},
			{Key: "timestamp", Value: []byte(time.Now().UTC().Format(time.RFC3339))},
		},
	}

	if err := writer.WriteMessages(ctx, msg); err != nil {
		return fmt.Errorf("failed to publish message to topic %s: %w", topic, err)
	}

	log.Printf("[Kafka] Published message to topic=%s key=%s size=%d bytes", topic, key, len(message))
	return nil
}

// Close gracefully shuts down all Kafka writers.
func (p *KafkaProducer) Close() error {
	var lastErr error
	for topic, w := range p.writers {
		if err := w.Close(); err != nil {
			log.Printf("[Kafka] Error closing writer for topic %s: %v", topic, err)
			lastErr = err
		}
	}
	return lastErr
}
