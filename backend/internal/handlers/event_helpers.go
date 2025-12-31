package handlers

import (
	"strconv"
	"time"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/dto"
)

// Helper functions to convert between domain models and DTOs for events

func eventToDTO(event *models.Event) dto.ResDetailEvent {
	// Parse ID to int32
	id, _ := strconv.ParseInt(event.ID, 10, 32)
	userId, _ := strconv.ParseInt(event.UserID, 10, 32)
	
	res := dto.ResDetailEvent{
		Id:        int32(id),
		UserId:    int32(userId),
		Title:     event.Title,
		Type:      event.Type,
		StartTime: event.StartTime,
		IsAllDay:  event.IsAllDay,
		CreatedAt: event.CreatedAt,
		UpdatedAt: event.UpdatedAt,
	}

	if event.Description != "" {
		res.Description = event.Description
	}
	if len(event.Tags) > 0 {
		res.Tags = event.Tags
	}
	if event.EndTime != nil {
		res.EndTime = *event.EndTime
	}
	if event.DueDate != nil {
		res.DueDate = event.DueDate.Format("2006-01-02")
	}
	if event.Status != "" {
		res.Status = event.Status
	}
	if event.Priority != "" {
		res.Priority = event.Priority
	}
	if event.CategoryID != nil {
		catId, _ := strconv.ParseInt(*event.CategoryID, 10, 32)
		res.CategoryId = int32(catId)
	}

	return res
}

func eventsToDTO(events []*models.Event) []dto.ResDetailEvent {
	result := make([]dto.ResDetailEvent, len(events))
	for i, event := range events {
		result[i] = eventToDTO(event)
	}
	return result
}

func dtoToCreateRequest(dto *dto.ReqCreateEvent, userID string) *models.CreateEventRequest {
	req := &models.CreateEventRequest{
		UserID:      userID,
		Title:       dto.Title,
		Description: dto.Description,
		Tags:        dto.Tags,
		Type:        models.EventType(dto.Type),
		StartTime:   dto.StartTime,
		IsAllDay:    dto.IsAllDay,
	}

	if !dto.EndTime.IsZero() {
		req.EndTime = &dto.EndTime
	}

	if dto.DueDate != "" {
		dueDate, err := time.Parse("2006-01-02", dto.DueDate)
		if err == nil {
			req.DueDate = &dueDate
		}
	}

	if dto.Status != "" {
		req.Status = models.EventStatus(dto.Status)
	}
	if dto.Priority != "" {
		req.Priority = models.EventPriority(dto.Priority)
	}
	if dto.CategoryId != 0 {
		catId := strconv.FormatInt(int64(dto.CategoryId), 10)
		req.CategoryID = &catId
	}

	return req
}

func dtoToUpdateRequest(dto *dto.ReqUpdateEvent) *models.UpdateEventRequest {
	req := &models.UpdateEventRequest{}

	if dto.Title != "" {
		req.Title = &dto.Title
	}
	if dto.Description != "" {
		req.Description = &dto.Description
	}
	if len(dto.Tags) > 0 {
		req.Tags = &dto.Tags
	}
	if !dto.StartTime.IsZero() {
		req.StartTime = &dto.StartTime
	}
	if !dto.EndTime.IsZero() {
		req.EndTime = &dto.EndTime
	}
	if dto.DueDate != "" {
		dueDate, err := time.Parse("2006-01-02", dto.DueDate)
		if err == nil {
			req.DueDate = &dueDate
		}
	}
	if dto.Status != "" {
		status := models.EventStatus(dto.Status)
		req.Status = &status
	}
	if dto.Priority != "" {
		priority := models.EventPriority(dto.Priority)
		req.Priority = &priority
	}
	if dto.CategoryId != 0 {
		catId := strconv.FormatInt(int64(dto.CategoryId), 10)
		req.CategoryID = &catId
	}
	req.IsAllDay = &dto.IsAllDay

	return req
}
