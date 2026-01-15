package repository

import (
	"context"
	"fmt"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/database"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
	"gorm.io/gorm"
)

// EventRepository defines the interface for event data operations
type EventRepository interface {
	Create(ctx context.Context, event *models.Event) (*models.Event, error)
	GetByID(ctx context.Context, id string, userID string) (*models.Event, error)
	List(ctx context.Context, filter *models.EventFilter) ([]*models.Event, error)
	Update(ctx context.Context, id string, userID string, updates *models.UpdateEventRequest) (*models.Event, error)
	Delete(ctx context.Context, id string, userID string) error
	ExistsByID(ctx context.Context, id string, userID string) (bool, error)
}

type eventRepository struct {
	db *database.DB
}

// NewEventRepository creates a new event repository instance
func NewEventRepository(db *database.DB) EventRepository {
	return &eventRepository{db: db}
}

func (r *eventRepository) Create(ctx context.Context, event *models.Event) (*models.Event, error) {
	if err := r.db.WithContext(ctx).Create(event).Error; err != nil {
		return nil, fmt.Errorf("failed to create event: %w", err)
	}

	return event, nil
}

func (r *eventRepository) GetByID(ctx context.Context, id string, userID string) (*models.Event, error) {
	var event models.Event
	err := r.db.WithContext(ctx).
		Where("id = ? AND user_id = ?", id, userID).
		First(&event).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to get event: %w", err)
	}

	return &event, nil
}

func (r *eventRepository) List(ctx context.Context, filter *models.EventFilter) ([]*models.Event, error) {
	var dbEvents []models.Event

	query := r.db.WithContext(ctx).Where("user_id = ?", filter.UserID)

	// Apply type filter
	if filter.Type != nil {
		query = query.Where("type = ?", string(*filter.Type))
	}

	// Apply status filter
	if filter.Status != nil {
		query = query.Where("status = ?", string(*filter.Status))
	}

	// Apply date range filter
	if filter.StartRange != nil && filter.EndRange != nil {
		query = query.Where(
			"start_time <= ? AND (end_time IS NULL OR end_time >= ?)",
			filter.EndRange,
			filter.StartRange,
		)
	}

	if err := query.Order("start_time ASC").Find(&dbEvents).Error; err != nil {
		return nil, fmt.Errorf("failed to list events: %w", err)
	}

	// Convert to pointers
	events := make([]*models.Event, len(dbEvents))
	for i := range dbEvents {
		events[i] = &dbEvents[i]
	}

	return events, nil
}

func (r *eventRepository) Update(ctx context.Context, id string, userID string, updates *models.UpdateEventRequest) (*models.Event, error) {
	var event models.Event

	// First, get the existing event
	err := r.db.WithContext(ctx).
		Where("id = ? AND user_id = ?", id, userID).
		First(&event).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to find event: %w", err)
	}

	// Apply updates
	updateMap := make(map[string]interface{})

	if updates.Title != nil {
		updateMap["title"] = *updates.Title
	}
	if updates.Description != nil {
		updateMap["description"] = *updates.Description
	}
	if updates.Tags != nil {
		updateMap["tags"] = *updates.Tags
	}
	if updates.StartTime != nil {
		updateMap["start_time"] = *updates.StartTime
	}
	if updates.EndTime != nil {
		updateMap["end_time"] = *updates.EndTime
	}
	if updates.DueDate != nil {
		updateMap["due_date"] = *updates.DueDate
	}
	if updates.Status != nil {
		updateMap["status"] = string(*updates.Status)
	}
	if updates.Priority != nil {
		updateMap["priority"] = string(*updates.Priority)
	}
	if updates.CategoryID != nil {
		updateMap["category_id"] = *updates.CategoryID
	}
	if updates.IsAllDay != nil {
		updateMap["is_all_day"] = *updates.IsAllDay
	}

	// Perform update
	if len(updateMap) > 0 {
		if err := r.db.WithContext(ctx).Model(&event).Updates(updateMap).Error; err != nil {
			return nil, fmt.Errorf("failed to update event: %w", err)
		}
	}

	// Fetch the updated event
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&event).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch updated event: %w", err)
	}

	return &event, nil
}

func (r *eventRepository) Delete(ctx context.Context, id string, userID string) error {
	result := r.db.WithContext(ctx).
		Where("id = ? AND user_id = ?", id, userID).
		Delete(&models.Event{})

	if result.Error != nil {
		return fmt.Errorf("failed to delete event: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return ErrNotFound
	}

	return nil
}

func (r *eventRepository) ExistsByID(ctx context.Context, id string, userID string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&models.Event{}).
		Where("id = ? AND user_id = ?", id, userID).
		Count(&count).Error

	if err != nil {
		return false, fmt.Errorf("failed to check event existence: %w", err)
	}

	return count > 0, nil
}
