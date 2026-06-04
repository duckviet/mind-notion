package handlers

import (
	"testing"
	"time"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
)

func TestEventToDTOIncludesGoogleCalendarMetadata(t *testing.T) {
	googleEventID := "google-event-123"
	event := &models.Event{
		ID:            "event-1",
		UserID:        "42",
		Title:         "Google event",
		Type:          string(models.EventTypeEvent),
		StartTime:     time.Date(2026, 6, 4, 9, 0, 0, 0, time.UTC),
		GoogleEventID: &googleEventID,
		Source:        "google",
		CreatedAt:     time.Date(2026, 6, 4, 8, 0, 0, 0, time.UTC),
		UpdatedAt:     time.Date(2026, 6, 4, 8, 30, 0, 0, time.UTC),
	}

	dto := eventToDTO(event)

	if dto.GoogleEventId == nil || *dto.GoogleEventId != googleEventID {
		t.Fatalf("expected google event id %q, got %#v", googleEventID, dto.GoogleEventId)
	}
	if dto.Source != "google" {
		t.Fatalf("expected source google, got %q", dto.Source)
	}
}
