package service

import (
	"context"
	"fmt"
	"time"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/repository"
)

// EventService handles business logic for events
type EventService struct {
	repo repository.EventRepository
}

// NewEventService creates a new event service instance
func NewEventService(repo repository.EventRepository) *EventService {
	return &EventService{repo: repo}
}

// CreateEvent creates a new event
func (s *EventService) CreateEvent(ctx context.Context, req *models.CreateEventRequest) (*models.Event, error) {
	// Validate request
	if req.Title == "" {
		return nil, fmt.Errorf("title is required")
	}
	if req.Type == "" {
		return nil, fmt.Errorf("type is required")
	}
	if req.StartTime.IsZero() {
		return nil, fmt.Errorf("start_time is required")
	}
	
	// Validate event type
	switch req.Type {
	case models.EventTypeTask, models.EventTypeEvent, models.EventTypeNote:
		// Valid types
	default:
		return nil, fmt.Errorf("invalid event type: %s", req.Type)
	}
	
	// Set defaults
	if req.Status == "" {
		req.Status = models.EventStatusPending
	}
	if req.Priority == "" {
		req.Priority = models.EventPriorityMedium
	}
	
	// Create event
	event := &models.Event{
		UserID:      req.UserID,
		Title:       req.Title,
		Description: req.Description,
		Tags:        req.Tags,
		Type:        string(req.Type),
		StartTime:   req.StartTime,
		EndTime:     req.EndTime,
		DueDate:     req.DueDate,
		Status:      string(req.Status),
		Priority:    string(req.Priority),
		CategoryID:  req.CategoryID,
		IsAllDay:    req.IsAllDay,
	}
	
	// Validate event
	if !event.IsValid() {
		return nil, fmt.Errorf("invalid event data")
	}
	
	return s.repo.Create(ctx, event)
}

// GetEvent retrieves an event by ID
func (s *EventService) GetEvent(ctx context.Context, id string, userID string) (*models.Event, error) {
	if id == "" {
		return nil, fmt.Errorf("invalid event ID")
	}
	
	event, err := s.repo.GetByID(ctx, id, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get event: %w", err)
	}
	
	return event, nil
}

// ListEvents retrieves events based on filters
func (s *EventService) ListEvents(ctx context.Context, userID string, eventType, status string) ([]*models.Event, error) {
	filter := &models.EventFilter{
		UserID: userID,
	}
	
	if eventType != "" {
		t := models.EventType(eventType)
		filter.Type = &t
	}
	
	if status != "" {
		st := models.EventStatus(status)
		filter.Status = &st
	}
	
	return s.repo.List(ctx, filter)
}

// ListEventsInRange retrieves events within a specific date/time range
func (s *EventService) ListEventsInRange(ctx context.Context, userID string, start, end time.Time, eventType string) ([]*models.Event, error) {
	filter := &models.EventFilter{
		UserID:     userID,
		StartRange: &start,
		EndRange:   &end,
	}
	
	if eventType != "" {
		t := models.EventType(eventType)
		filter.Type = &t
	}
	
	return s.repo.List(ctx, filter)
}

// UpdateEvent updates an existing event
func (s *EventService) UpdateEvent(ctx context.Context, id string, userID string, updates *models.UpdateEventRequest) (*models.Event, error) {
	if id == "" {
		return nil, fmt.Errorf("invalid event ID")
	}
	
	// Check if event exists
	exists, err := s.repo.ExistsByID(ctx, id, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check event existence: %w", err)
	}
	if !exists {
		return nil, repository.ErrNotFound
	}
	
	// Validate updates
	if updates.Title != nil && *updates.Title == "" {
		return nil, fmt.Errorf("title cannot be empty")
	}
	
	return s.repo.Update(ctx, id, userID, updates)
}

// DeleteEvent deletes an event
func (s *EventService) DeleteEvent(ctx context.Context, id string, userID string) error {
	if id == "" {
		return fmt.Errorf("invalid event ID")
	}
	
	err := s.repo.Delete(ctx, id, userID)
	if err != nil {
		return fmt.Errorf("failed to delete event: %w", err)
	}
	
	return nil
}

// CompleteTask marks a task as completed
func (s *EventService) CompleteTask(ctx context.Context, id string, userID string) (*models.Event, error) {
	event, err := s.repo.GetByID(ctx, id, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get event: %w", err)
	}
	
	if event.Type != string(models.EventTypeTask) {
		return nil, fmt.Errorf("event is not a task")
	}
	
	status := models.EventStatusCompleted
	updates := &models.UpdateEventRequest{
		Status: &status,
	}
	
	return s.repo.Update(ctx, id, userID, updates)
}
