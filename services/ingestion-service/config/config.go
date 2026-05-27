package config

import (
	"os"
	"strconv"
	"strings"
)

// Config holds all configuration for the ingestion service.
type Config struct {
	Port         string
	KafkaBrokers []string
	APIKey       string
	LogLevel     string
	RateLimit    int
}

// Load reads configuration from environment variables with sensible defaults.
func Load() *Config {
	port := getEnv("PORT", "8002")
	brokersRaw := getEnv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
	brokers := strings.Split(brokersRaw, ",")
	apiKey := getEnv("API_KEY", "") // Must be set via API_KEY environment variable
	logLevel := getEnv("LOG_LEVEL", "info")
	rateLimit, _ := strconv.Atoi(getEnv("RATE_LIMIT", "100"))
	if rateLimit <= 0 {
		rateLimit = 100
	}

	return &Config{
		Port:         port,
		KafkaBrokers: brokers,
		APIKey:       apiKey,
		LogLevel:     logLevel,
		RateLimit:    rateLimit,
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
