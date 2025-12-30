package handlers

import (
	"net/http"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/config"
	"github.com/gin-gonic/gin"
)

// setAuthCookies sets HttpOnly cookies for access and refresh tokens
// This follows security best practices from large-scale web applications
// and ensures SameSite=None; Secure in production for cross-origin usage.
func setAuthCookies(c *gin.Context, cfg *config.Config, accessToken, refreshToken string) {
	isProduction := cfg.Server.Mode == "release"

	// SameSite strategy:
	// - Lax in development (localhost)
	// - None in production so cookies work cross-site with HTTPS
	sameSite := http.SameSiteLaxMode
	if isProduction {
		sameSite = http.SameSiteNoneMode
	}

	// Access token cookie: 1 hour expiry
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		Path:     "/",
		MaxAge:   3600, // 1 hour in seconds
		HttpOnly: true,
		Secure:   isProduction,
		SameSite: sameSite,
	})

	// Refresh token cookie: 7 days expiry
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Path:     "/",
		MaxAge:   7 * 24 * 3600, // 7 days in seconds
		HttpOnly: true,
		Secure:   isProduction,
		SameSite: sameSite,
	})
}

// clearAuthCookies clears authentication cookies
func clearAuthCookies(c *gin.Context, cfg *config.Config) {
	isProduction := cfg.Server.Mode == "release"

	sameSite := http.SameSiteLaxMode
	if isProduction {
		sameSite = http.SameSiteNoneMode
	}

	// Clear access token
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "access_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1, // Expire immediately
		HttpOnly: true,
		Secure:   isProduction,
		SameSite: sameSite,
	})

	// Clear refresh token
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   isProduction,
		SameSite: sameSite,
	})
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

