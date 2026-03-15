package handlers

import (
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/service"
	"github.com/gin-gonic/gin"
)

// GoogleCalendarAPI handles Google Calendar OAuth and sync endpoints
type GoogleCalendarAPI struct {
	gcalService *service.GoogleCalendarService
	authService service.AuthService
}

// NewGoogleCalendarAPI creates a new GoogleCalendarAPI handler
func NewGoogleCalendarAPI(gcalService *service.GoogleCalendarService, authService service.AuthService) *GoogleCalendarAPI {
	return &GoogleCalendarAPI{
		gcalService: gcalService,
		authService: authService,
	}
}

// GET /api/v1/auth/google/calendar
// Redirects user to Google OAuth consent screen
func (api *GoogleCalendarAPI) InitiateOAuth(c *gin.Context) {
	userVal, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	u := userVal.(*models.User)

	url := api.gcalService.GetAuthURL(u.ID)
	// Return the URL as JSON so the frontend can redirect, 
	// avoiding CORS errors and allowing JWT token attachment.
	c.JSON(http.StatusOK, gin.H{"url": url})
}

// GET /api/v1/auth/google/calendar/callback  (public path)
// Exchanges OAuth code for tokens and stores them
func (api *GoogleCalendarAPI) OAuthCallback(c *gin.Context) {
	oauthError := c.Query("error")
	code := c.Query("code")
	state := c.Query("state") // state == userID (set in GetAuthURL)
	callbackURL := frontendGoogleCallbackURL()

	if oauthError != "" {
		c.Redirect(http.StatusTemporaryRedirect, callbackURL+"?error=google_denied")
		return
	}

	if code == "" || state == "" {
		c.Redirect(http.StatusTemporaryRedirect, callbackURL+"?error=missing_params")
		return
	}

	if err := api.gcalService.HandleCallback(c.Request.Context(), code, state); err != nil {
		log.Printf("google calendar callback failed: %v", err)
		if strings.Contains(err.Error(), "reconnect required") {
			c.Redirect(http.StatusTemporaryRedirect, callbackURL+"?error=reconnect_required")
			return
		}
		c.Redirect(http.StatusTemporaryRedirect, callbackURL+"?error=oauth_failed")
		return
	}

	c.Redirect(http.StatusTemporaryRedirect, callbackURL+"?google_connected=true")
}

func frontendGoogleCallbackURL() string {
	frontendOrigin := strings.TrimRight(strings.TrimSpace(os.Getenv("FRONTEND_URL")), "/")
	if frontendOrigin == "" {
		frontendOrigin = "http://localhost:3000"
	}

	return frontendOrigin + "/auth/google/callback"
}

// GET /api/v1/auth/google/calendar/status
// Returns whether the user has connected Google Calendar
func (api *GoogleCalendarAPI) GetStatus(c *gin.Context) {
	userVal, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	u := userVal.(*models.User)

	status := api.gcalService.GetStatus(c.Request.Context(), u.ID)
	c.JSON(http.StatusOK, status)
}

// DELETE /api/v1/auth/google/calendar
// Disconnects Google Calendar (removes tokens)
func (api *GoogleCalendarAPI) Disconnect(c *gin.Context) {
	userVal, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	u := userVal.(*models.User)

	if err := api.gcalService.Disconnect(c.Request.Context(), u.ID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to disconnect"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Google Calendar disconnected"})
}

// POST /api/v1/calendar/google/sync
// Manually triggers a sync from Google Calendar into the app
func (api *GoogleCalendarAPI) SyncFromGoogle(c *gin.Context) {
	userVal, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	u := userVal.(*models.User)

	count, err := api.gcalService.SyncFromGoogle(c.Request.Context(), u.ID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"synced": count, "message": "Sync completed"})
}

// POST /api/v1/calendar/google/push/:id
// Pushes a specific local event to Google Calendar
func (api *GoogleCalendarAPI) PushToGoogle(c *gin.Context) {
	userVal, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	u := userVal.(*models.User)

	eventID := c.Param("id")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "event id is required"})
		return
	}

	if err := api.gcalService.PushToGoogle(c.Request.Context(), u.ID, eventID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Event pushed to Google Calendar"})
}
