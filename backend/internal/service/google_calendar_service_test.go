package service

import (
	"testing"
	"time"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/config"
)

func TestGoogleCalendarStatusReportsConfigurationState(t *testing.T) {
	service := NewGoogleCalendarService(nil, nil, config.GoogleConfig{})

	status := service.GetStatus(t.Context(), "user-1")

	if status.Configured {
		t.Fatal("expected empty OAuth config to report configured=false")
	}
	if status.Connected {
		t.Fatal("expected unconfigured calendar service to report connected=false")
	}
}

func TestGoogleEventEndDateTimeDefaultsAllDayEndToNextDay(t *testing.T) {
	start := time.Date(2026, 6, 4, 0, 0, 0, 0, time.UTC)

	end := googleEventEndDateTime(start, nil, true)

	if end == nil {
		t.Fatal("expected default all-day end date")
	}
	if end.Date != "2026-06-05" {
		t.Fatalf("expected exclusive next-day all-day end date, got %q", end.Date)
	}
	if end.DateTime != "" {
		t.Fatalf("expected all-day end to use Date only, got DateTime %q", end.DateTime)
	}
}
