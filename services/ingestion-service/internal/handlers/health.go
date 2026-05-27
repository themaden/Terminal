package handlers

import (
	"net/http"
	"runtime"
	"time"

	"github.com/gin-gonic/gin"
)

var startTime = time.Now()

// HealthResponse contains the health check response.
type HealthResponse struct {
	Status    string `json:"status"`
	Service   string `json:"service"`
	Version   string `json:"version"`
	Uptime    string `json:"uptime"`
	GoVersion string `json:"go_version"`
	Timestamp string `json:"timestamp"`
}

// HealthHandler returns the health status of the service.
func HealthHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		resp := HealthResponse{
			Status:    "healthy",
			Service:   "ingestion-service",
			Version:   "1.0.0",
			Uptime:    time.Since(startTime).String(),
			GoVersion: runtime.Version(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		}
		c.JSON(http.StatusOK, resp)
	}
}
