package service

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/config"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/repository"
	"github.com/lib/pq"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	googlecalendar "google.golang.org/api/calendar/v3"
	"google.golang.org/api/option"
	"gorm.io/gorm"
)

// GoogleCalendarService handles Google Calendar OAuth and sync operations
type GoogleCalendarService struct {
	db          *gorm.DB
	accountRepo repository.AccountRepository
	oauthConfig *oauth2.Config
}

// GoogleCalendarStatus represents the connection status for a user
type GoogleCalendarStatus struct {
	Connected bool `json:"connected"`
}

// NewGoogleCalendarService creates a new GoogleCalendarService instance
func NewGoogleCalendarService(db *gorm.DB, accountRepo repository.AccountRepository, cfg config.GoogleConfig) *GoogleCalendarService {
	oauthConfig := &oauth2.Config{
		ClientID:     cfg.ClientID,
		ClientSecret: cfg.ClientSecret,
		RedirectURL:  cfg.RedirectURI,
		Scopes: []string{
			googlecalendar.CalendarScope,
		},
		Endpoint: google.Endpoint,
	}
	return &GoogleCalendarService{db: db, accountRepo: accountRepo, oauthConfig: oauthConfig}
}

// GetAuthURL generates the Google OAuth2 authorization URL
// state encodes the userID so we can associate tokens on callback
func (s *GoogleCalendarService) GetAuthURL(userID string) string {
	return s.oauthConfig.AuthCodeURL(
		userID,
		oauth2.AccessTypeOffline,
		oauth2.SetAuthURLParam("prompt", "consent"),
		oauth2.SetAuthURLParam("include_granted_scopes", "true"),
	)
}

// HandleCallback exchanges the OAuth code for tokens and persists them
func (s *GoogleCalendarService) HandleCallback(ctx context.Context, code, userID string) error {
	token, err := s.oauthConfig.Exchange(ctx, code)
	if err != nil {
		return fmt.Errorf("failed to exchange oauth code: %w", err)
	}

	refreshToken := token.RefreshToken
	if refreshToken == "" {
		// Try to reuse the existing refresh token if one already exists
		existing, getErr := s.accountRepo.GetByUserProviderService(ctx, userID, models.AccountProviderGoogle, models.AccountServiceCalendar)
		if getErr == nil && existing.RefreshToken != nil {
			refreshToken = *existing.RefreshToken
		}
	}

	providerAccountID := userID
	googleAuthAccount, authErr := s.accountRepo.GetByUserProviderService(ctx, userID, models.AccountProviderGoogle, models.AccountServiceAuth)
	if authErr == nil {
		providerAccountID = googleAuthAccount.ProviderAccountID
	} else if authErr != gorm.ErrRecordNotFound {
		return fmt.Errorf("failed to get google auth account: %w", authErr)
	}

	accessToken := token.AccessToken
	var refreshTokenPtr *string
	if refreshToken != "" {
		refreshTokenCopy := refreshToken
		refreshTokenPtr = &refreshTokenCopy
	}
	tokenType := token.TokenType
	account := &models.Account{
		UserID:            userID,
		Provider:          models.AccountProviderGoogle,
		ProviderAccountID: providerAccountID,
		ServiceType:       models.AccountServiceCalendar,
		AccessToken:       &accessToken,
		RefreshToken:      refreshTokenPtr,
		ExpiresAt:         &token.Expiry,
		TokenType:         &tokenType,
		Scope:             pq.StringArray{googlecalendar.CalendarScope},
		IsConnected:       true,
	}
	if err := s.accountRepo.Upsert(ctx, account); err != nil {
		return fmt.Errorf("failed to store google calendar account: %w", err)
	}

	return nil
}

// GetStatus returns whether a user has connected Google Calendar
func (s *GoogleCalendarService) GetStatus(ctx context.Context, userID string) GoogleCalendarStatus {
	connected, err := s.accountRepo.IsConnected(ctx, userID, models.AccountProviderGoogle, models.AccountServiceCalendar)
	if err != nil {
		log.Printf("google-calendar status: failed to check account for user %s: %v", userID, err)
		return GoogleCalendarStatus{Connected: false}
	}
	return GoogleCalendarStatus{Connected: connected}
}

// Disconnect removes the user's Google tokens
func (s *GoogleCalendarService) Disconnect(ctx context.Context, userID string) error {
	return s.accountRepo.Disconnect(ctx, userID, models.AccountProviderGoogle, models.AccountServiceCalendar)
}

// getOAuthToken retrieves a valid (refreshed if needed) OAuth token for the user
func (s *GoogleCalendarService) getOAuthToken(ctx context.Context, userID string) (*oauth2.Token, error) {
	calendarAccount, err := s.accountRepo.GetByUserProviderService(ctx, userID, models.AccountProviderGoogle, models.AccountServiceCalendar)
	if err != nil {
		return nil, fmt.Errorf("google calendar not connected")
	}
	if !calendarAccount.IsConnected {
		return nil, fmt.Errorf("google calendar not connected")
	}
	if calendarAccount.AccessToken == nil {
		return nil, fmt.Errorf("google calendar tokens missing")
	}

	token := &oauth2.Token{
		AccessToken: *calendarAccount.AccessToken,
	}
	if calendarAccount.RefreshToken != nil {
		token.RefreshToken = *calendarAccount.RefreshToken
	}
	if calendarAccount.ExpiresAt != nil {
		token.Expiry = *calendarAccount.ExpiresAt
	}

	// Auto-refresh if expired
	if token.Expiry.IsZero() || token.Expiry.Before(time.Now()) {
		if token.RefreshToken == "" {
			return nil, fmt.Errorf("google calendar token expired, reconnect required")
		}
		tokenSource := s.oauthConfig.TokenSource(ctx, token)
		newToken, err := tokenSource.Token()
		if err != nil {
			return nil, fmt.Errorf("failed to refresh token: %w", err)
		}

		refreshToken := newToken.RefreshToken
		if refreshToken == "" {
			refreshToken = *calendarAccount.RefreshToken
		}
		accessToken := newToken.AccessToken
		tokenType := newToken.TokenType
		updatedAccount := &models.Account{
			UserID:            userID,
			Provider:          models.AccountProviderGoogle,
			ProviderAccountID: calendarAccount.ProviderAccountID,
			ServiceType:       models.AccountServiceCalendar,
			AccessToken:       &accessToken,
			RefreshToken:      &refreshToken,
			ExpiresAt:         &newToken.Expiry,
			TokenType:         &tokenType,
			Scope:             calendarAccount.Scope,
			IsConnected:       true,
			LastSyncAt:        calendarAccount.LastSyncAt,
			LastFailedAt:      calendarAccount.LastFailedAt,
		}
		if err := s.accountRepo.Upsert(ctx, updatedAccount); err != nil {
			return nil, fmt.Errorf("failed to persist refreshed token: %w", err)
		}
		return newToken, nil
	}

	return token, nil
}

// getCalendarService creates an authenticated Google Calendar API client
func (s *GoogleCalendarService) getCalendarService(ctx context.Context, userID string) (*googlecalendar.Service, error) {
	token, err := s.getOAuthToken(ctx, userID)
	if err != nil {
		return nil, err
	}

	tokenSource := s.oauthConfig.TokenSource(ctx, token)
	calSvc, err := googlecalendar.NewService(ctx, option.WithTokenSource(tokenSource))
	if err != nil {
		return nil, fmt.Errorf("failed to create calendar client: %w", err)
	}
	return calSvc, nil
}

// SyncFromGoogle pulls events from Google Calendar and upserts them into the local DB
// It syncs events within a 7-day lookback + 30-day lookahead window
func (s *GoogleCalendarService) SyncFromGoogle(ctx context.Context, userID string) (int, error) {
	calSvc, err := s.getCalendarService(ctx, userID)
	if err != nil {
		s.db.Model(&models.Account{}).
			Where("user_id = ? AND provider = ? AND service_type = ? AND deleted_at IS NULL", userID, models.AccountProviderGoogle, models.AccountServiceCalendar).
			Update("last_failed_at", time.Now().UTC())
		return 0, err
	}

	now := time.Now()
	timeMin := now.AddDate(0, 0, -7).Format(time.RFC3339)
	timeMax := now.AddDate(0, 0, 30).Format(time.RFC3339)

	events, err := calSvc.Events.List("primary").
		TimeMin(timeMin).
		TimeMax(timeMax).
		SingleEvents(true).
		OrderBy("startTime").
		Do()
	if err != nil {
		s.db.Model(&models.Account{}).
			Where("user_id = ? AND provider = ? AND service_type = ? AND deleted_at IS NULL", userID, models.AccountProviderGoogle, models.AccountServiceCalendar).
			Update("last_failed_at", time.Now().UTC())
		return 0, fmt.Errorf("failed to fetch google calendar events: %w", err)
	}

	synced := 0
	for _, gEvent := range events.Items {
		if gEvent.Status == "cancelled" {
			// Delete locally if exists
			s.db.Where("google_event_id = ? AND user_id = ?", gEvent.Id, userID).
				Delete(&models.Event{})
			continue
		}

		startTime, endTime, isAllDay, err := parseGoogleEventTimes(gEvent)
		if err != nil {
			log.Printf("skipping google event %s: %v", gEvent.Id, err)
			continue
		}

		title := gEvent.Summary
		if title == "" {
			title = "(No title)"
		}
		description := gEvent.Description
		googleID := gEvent.Id
		source := "google"

		// Check if event already exists by google_event_id
		var existing models.Event
		err = s.db.Where("google_event_id = ? AND user_id = ?", googleID, userID).First(&existing).Error

		if err == gorm.ErrRecordNotFound {
			// Create new
			newEvent := models.Event{
				UserID:        userID,
				Title:         title,
				Description:   description,
				Type:          string(models.EventTypeEvent),
				StartTime:     startTime,
				EndTime:       endTime,
				Status:        string(models.EventStatusPending),
				Priority:      string(models.EventPriorityMedium),
				IsAllDay:      isAllDay,
				GoogleEventID: &googleID,
				Source:        source,
			}
			if err := s.db.Create(&newEvent).Error; err != nil {
				log.Printf("failed to create event from google: %v", err)
				continue
			}
		} else if err == nil {
			// Update existing
			updates := map[string]interface{}{
				"title":       title,
				"description": description,
				"start_time":  startTime,
				"end_time":    endTime,
				"is_all_day":  isAllDay,
			}
			if err := s.db.Model(&existing).Updates(updates).Error; err != nil {
				log.Printf("failed to update event from google: %v", err)
				continue
			}
		}
		synced++
	}

	syncedAt := time.Now().UTC()
	s.db.Model(&models.Account{}).
		Where("user_id = ? AND provider = ? AND service_type = ? AND deleted_at IS NULL", userID, models.AccountProviderGoogle, models.AccountServiceCalendar).
		Updates(map[string]interface{}{
			"last_sync_at":   syncedAt,
			"last_failed_at": nil,
			"is_connected":   true,
		})

	return synced, nil
}

// PushToGoogle pushes a local event to Google Calendar
// It creates or updates a Google Calendar event based on whether google_event_id exists
func (s *GoogleCalendarService) PushToGoogle(ctx context.Context, userID, eventID string) error {
	calSvc, err := s.getCalendarService(ctx, userID)
	if err != nil {
		return err
	}

	var event models.Event
	if err := s.db.Where("id = ? AND user_id = ?", eventID, userID).First(&event).Error; err != nil {
		return fmt.Errorf("event not found")
	}

	gEvent := &googlecalendar.Event{
		Summary:     event.Title,
		Description: event.Description,
		Start:       googleEventDateTime(event.StartTime, event.IsAllDay),
		End:         googleEventEndDateTime(event.StartTime, event.EndTime, event.IsAllDay),
	}

	if event.GoogleEventID != nil && *event.GoogleEventID != "" {
		// Update existing Google event
		_, err = calSvc.Events.Update("primary", *event.GoogleEventID, gEvent).Do()
		if err != nil {
			return fmt.Errorf("failed to update google calendar event: %w", err)
		}
	} else {
		// Create new Google event
		created, err := calSvc.Events.Insert("primary", gEvent).Do()
		if err != nil {
			return fmt.Errorf("failed to create google calendar event: %w", err)
		}
		// Persist google_event_id
		s.db.Model(&event).Updates(map[string]interface{}{
			"google_event_id": created.Id,
		})
	}

	return nil
}

// SyncAllUsers syncs Google Calendar for all users who have connected their account.
// Designed to be called from a background goroutine on a ticker.
func (s *GoogleCalendarService) SyncAllUsers(ctx context.Context) {
	userIDs, err := s.accountRepo.ListConnectedUserIDs(ctx, models.AccountProviderGoogle, models.AccountServiceCalendar)
	if err != nil {
		log.Printf("auto-sync: failed to list google calendar accounts: %v", err)
		return
	}

	for _, userID := range userIDs {
		count, err := s.SyncFromGoogle(ctx, userID)
		if err != nil {
			log.Printf("auto-sync: failed for user %s: %v", userID, err)
		} else {
			log.Printf("auto-sync: synced %d events for user %s", count, userID)
		}
	}
}

// --- Helpers ---

func parseGoogleEventTimes(gEvent *googlecalendar.Event) (startTime time.Time, endTime *time.Time, isAllDay bool, err error) {
	if gEvent.Start == nil {
		return time.Time{}, nil, false, fmt.Errorf("event has no start time")
	}

	if gEvent.Start.Date != "" {
		// All-day event
		isAllDay = true
		startTime, err = time.Parse("2006-01-02", gEvent.Start.Date)
		if err != nil {
			return time.Time{}, nil, true, fmt.Errorf("invalid all-day start date: %w", err)
		}
		if gEvent.End != nil && gEvent.End.Date != "" {
			et, e := time.Parse("2006-01-02", gEvent.End.Date)
			if e == nil {
				endTime = &et
			}
		}
	} else {
		// Timed event
		startTime, err = time.Parse(time.RFC3339, gEvent.Start.DateTime)
		if err != nil {
			return time.Time{}, nil, false, fmt.Errorf("invalid start datetime: %w", err)
		}
		if gEvent.End != nil && gEvent.End.DateTime != "" {
			et, e := time.Parse(time.RFC3339, gEvent.End.DateTime)
			if e == nil {
				endTime = &et
			}
		}
	}
	return
}

func googleEventDateTime(t time.Time, isAllDay bool) *googlecalendar.EventDateTime {
	if isAllDay {
		return &googlecalendar.EventDateTime{Date: t.Format("2006-01-02")}
	}
	return &googlecalendar.EventDateTime{DateTime: t.Format(time.RFC3339)}
}

func googleEventEndDateTime(start time.Time, end *time.Time, isAllDay bool) *googlecalendar.EventDateTime {
	if end != nil {
		return googleEventDateTime(*end, isAllDay)
	}
	// Default: 1 hour after start
	defaultEnd := start.Add(1 * time.Hour)
	return googleEventDateTime(defaultEnd, isAllDay)
}
