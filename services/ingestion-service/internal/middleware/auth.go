package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// APIKeyAuth returns a Gin middleware that validates the X-API-Key header.
func APIKeyAuth(validKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if validKey == "" {
			// If no API key is configured, skip authentication
			c.Next()
			return
		}

		apiKey := c.GetHeader("X-API-Key")
		if apiKey == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   "unauthorized",
				"details": "missing X-API-Key header",
			})
			return
		}

		if apiKey != validKey {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error":   "forbidden",
				"details": "invalid API key",
			})
			return
		}

		c.Next()
	}
}
