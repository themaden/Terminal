package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// TokenBucket implements a token bucket rate limiter.
type TokenBucket struct {
	mu         sync.Mutex
	tokens     float64
	maxTokens  float64
	refillRate float64 // tokens per second
	lastRefill time.Time
}

// NewTokenBucket creates a token bucket with the given rate (requests per second).
func NewTokenBucket(ratePerSecond int) *TokenBucket {
	rate := float64(ratePerSecond)
	return &TokenBucket{
		tokens:     rate,
		maxTokens:  rate,
		refillRate: rate,
		lastRefill: time.Now(),
	}
}

// Allow checks if a request is allowed (consumes one token).
func (tb *TokenBucket) Allow() bool {
	tb.mu.Lock()
	defer tb.mu.Unlock()

	now := time.Now()
	elapsed := now.Sub(tb.lastRefill).Seconds()
	tb.tokens += elapsed * tb.refillRate
	if tb.tokens > tb.maxTokens {
		tb.tokens = tb.maxTokens
	}
	tb.lastRefill = now

	if tb.tokens >= 1.0 {
		tb.tokens -= 1.0
		return true
	}
	return false
}

// RateLimiter returns a Gin middleware that limits requests using a token bucket.
func RateLimiter(ratePerSecond int) gin.HandlerFunc {
	bucket := NewTokenBucket(ratePerSecond)

	return func(c *gin.Context) {
		if !bucket.Allow() {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error":   "rate_limit_exceeded",
				"details": "too many requests, please try again later",
			})
			return
		}
		c.Next()
	}
}
