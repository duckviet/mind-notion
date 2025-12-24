package handlers

import (
	"github.com/duckviet/gin-collaborative-editor/backend/internal/config"
	"github.com/gin-gonic/gin"
)

// setAuthCookies sets HttpOnly cookies for access and refresh tokens
// This follows security best practices from large-scale web applications
func setAuthCookies(c *gin.Context, cfg *config.Config, accessToken, refreshToken string) {
	// Determine if we're in production (Secure flag only in production)
	isProduction := cfg.Server.Mode == "release"

	// Access token cookie: 1 hour expiry
	c.SetCookie(
		"access_token",
		accessToken,
		3600, // 1 hour in seconds
		"/",  // path
		"",   // domain (empty = current domain)
		isProduction, // secure (HTTPS only in production)
		true, // httpOnly (cannot be accessed from JavaScript)
	)

	// Refresh token cookie: 7 days expiry
	c.SetCookie(
		"refresh_token",
		refreshToken,
		7*24*3600, // 7 days in seconds
		"/",
		"",
		isProduction,
		true,
	)
}

// clearAuthCookies clears authentication cookies
func clearAuthCookies(c *gin.Context, cfg *config.Config) {
	isProduction := cfg.Server.Mode == "release"

	// Clear access token
	c.SetCookie(
		"access_token",
		"",
		-1, // Expire immediately
		"/",
		"",
		isProduction,
		true,
	)

	// Clear refresh token
	c.SetCookie(
		"refresh_token",
		"",
		-1,
		"/",
		"",
		isProduction,
		true,
	)
}

// getRefreshTokenFromCookie gets refresh token from cookie (for HttpOnly cookies)
func getRefreshTokenFromCookie(c *gin.Context) string {
	cookie, err := c.Cookie("refresh_token")
	if err != nil {
		return ""
	}
	return cookie
}

// getAccessTokenFromCookie gets access token from cookie (for HttpOnly cookies)
func getAccessTokenFromCookie(c *gin.Context) string {
	cookie, err := c.Cookie("access_token")
	if err != nil {
		return ""
	}
	return cookie
}

// extractTokenFromRequest extracts token from either Authorization header or cookie
// Priority: Authorization header > Cookie
func extractTokenFromRequest(c *gin.Context) string {
	// Try Authorization header first
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" {
		token := extractBearerToken(c)
		if token != "" {
			return token
		}
	}

	// Fallback to cookie
	return getAccessTokenFromCookie(c)
}

