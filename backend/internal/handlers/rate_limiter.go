package handlers

import (
	"fmt"
	"net"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// Simple in-memory rate limiter middleware.
// Per-IP fixed window: max N requests per window.

type rateLimiterEntry struct {
	Requests   int
	WindowStart time.Time
}

var (
	rateLimiterStore = make(map[string]*rateLimiterEntry)
	rateLimiterMu    sync.Mutex

	// defaultRateLimit defines how many requests per IP per window are allowed.
	defaultRateLimit       = 100
	defaultRateLimitWindow = time.Minute
)

// getClientIP extracts a best-effort client IP (X-Forwarded-For -> RemoteAddr).
func getClientIP(c *gin.Context) string {
	// Try X-Forwarded-For (behind proxy / load balancer)
	if xff := c.GetHeader("X-Forwarded-For"); xff != "" {
		// Could be list: client, proxy1, proxy2
		for _, part := range splitAndTrim(xff, ",") {
			if ip := net.ParseIP(part); ip != nil {
				return ip.String()
			}
		}
	}

	// Fallback: Remote IP
	ip, _, err := net.SplitHostPort(c.Request.RemoteAddr)
	if err == nil && ip != "" {
		return ip
	}

	return c.ClientIP()
}

// splitAndTrim is a small helper to split and trim a string by a separator.
func splitAndTrim(s, sep string) []string {
	raw := make([]string, 0)
	start := 0
	for i := 0; i < len(s); i++ {
		if string(s[i]) == sep {
			raw = append(raw, s[start:i])
			start = i + 1
		}
	}
	raw = append(raw, s[start:])

	out := make([]string, 0, len(raw))
	for _, part := range raw {
		p := part
		// trim spaces
		for len(p) > 0 && (p[0] == ' ' || p[0] == '\t') {
			p = p[1:]
		}
		for len(p) > 0 && (p[len(p)-1] == ' ' || p[len(p)-1] == '\t') {
			p = p[:len(p)-1]
		}
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}

// rateLimitMiddleware limits the number of requests per IP per time window.
func rateLimitMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := getClientIP(c)
		now := time.Now()

		rateLimiterMu.Lock()
		entry, ok := rateLimiterStore[ip]
		if !ok || now.Sub(entry.WindowStart) > defaultRateLimitWindow {
			// New window
			entry = &rateLimiterEntry{
				Requests:   0,
				WindowStart: now,
			}
			rateLimiterStore[ip] = entry
		}

		entry.Requests++
		requests := entry.Requests
		windowStart := entry.WindowStart
		rateLimiterMu.Unlock()

		if requests > defaultRateLimit {
			resetIn := defaultRateLimitWindow - now.Sub(windowStart)
			if resetIn < 0 {
				resetIn = 0
			}

			c.Header("X-RateLimit-Limit", "100")
			c.Header("X-RateLimit-Remaining", "0")
			c.Header("X-RateLimit-Reset", time.Now().Add(resetIn).Format(time.RFC3339))

			c.AbortWithStatusJSON(429, gin.H{
				"error":   "rate limit exceeded",
				"message": "Too many requests. Please try again later.",
			})
			return
		}

		// Set rate limit headers
		c.Header("X-RateLimit-Limit", "100")
		c.Header("X-RateLimit-Remaining", fmt.Sprintf("%d", defaultRateLimit-requests))

		c.Next()
	}
}


