package service

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/config"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/repository"
)

// NoteService defines the interface for note business logic
type NoteService interface {
	CreateNote(ctx context.Context, req CreateNoteRequest) (*models.Note, error)
	GetNoteByID(ctx context.Context, id uint) (*models.Note, error)
	UpdateNote(ctx context.Context, id uint, req UpdateNoteRequest) (*models.Note, error)
	DeleteNote(ctx context.Context, id uint) error
	ListNotes(ctx context.Context, params repository.NoteListParams) ([]*models.Note, int64, error)
	GetNotesByUserID(ctx context.Context, userID uint, params repository.NoteListParams) ([]*models.Note, int64, error)
	AddTagToNote(ctx context.Context, noteID, tagID uint) error
	RemoveTagFromNote(ctx context.Context, noteID, tagID uint) error
}

// noteService implements NoteService
type noteService struct {
	repo   repository.NoteRepository
	config *config.Config
}

// CreateNoteRequest represents the request to create a note
type CreateNoteRequest struct {
	Title       string   `json:"title" validate:"required,min=1,max=200"`
	Content     string   `json:"content"`
	ContentType string   `json:"content_type" validate:"omitempty,oneof=text markdown html"`
	Status      string   `json:"status" validate:"omitempty,oneof=draft published archived"`
	Thumbnail   string   `json:"thumbnail,omitempty"`
	IsPublic    bool     `json:"is_public"`
	UserID      uint     `json:"user_id" validate:"required"`
	TagIDs      []uint   `json:"tag_ids,omitempty"`
}

// UpdateNoteRequest represents the request to update a note
type UpdateNoteRequest struct {
	Title       string   `json:"title,omitempty" validate:"omitempty,min=1,max=200"`
	Content     string   `json:"content,omitempty"`
	ContentType string   `json:"content_type,omitempty" validate:"omitempty,oneof=text markdown html"`
	Status      string   `json:"status,omitempty" validate:"omitempty,oneof=draft published archived"`
	Thumbnail   string   `json:"thumbnail,omitempty"`
	IsPublic    *bool    `json:"is_public,omitempty"`
	TagIDs      []uint   `json:"tag_ids,omitempty"`
}

// NewNoteService creates a new note service
func NewNoteService(repo repository.NoteRepository, config *config.Config) NoteService {
	return &noteService{
		repo:   repo,
		config: config,
	}
}

// CreateNote creates a new note
func (s *noteService) CreateNote(ctx context.Context, req CreateNoteRequest) (*models.Note, error) {
	// Set defaults
	if req.ContentType == "" {
		req.ContentType = "text"
	}
	if req.Status == "" {
		req.Status = "draft"
	}

	note := &models.Note{
		Title:       req.Title,
		Content:     req.Content,
		ContentType: req.ContentType,
		Status:      models.NoteStatus(req.Status),
		Thumbnail:   req.Thumbnail,
		IsPublic:    req.IsPublic,
		UserID:      req.UserID,
	}

	if err := s.repo.Create(ctx, note); err != nil {
		return nil, ErrInternalServerError
	}

	return note, nil
}

// GetNoteByID retrieves a note by ID
func (s *noteService) GetNoteByID(ctx context.Context, id uint) (*models.Note, error) {
	note, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNoteNotFound
		}
		return nil, ErrInternalServerError
	}
	return note, nil
}

// UpdateNote updates a note
func (s *noteService) UpdateNote(ctx context.Context, id uint, req UpdateNoteRequest) (*models.Note, error) {
	note, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNoteNotFound
		}
		return nil, ErrInternalServerError
	}

	// Update fields
	if req.Title != "" {
		note.Title = req.Title
	}
	if req.Content != "" {
		note.Content = req.Content
	}
	if req.ContentType != "" {
		note.ContentType = req.ContentType
	}
	if req.Status != "" {
		note.Status = models.NoteStatus(req.Status)
	}
	if req.Thumbnail != "" {
		note.Thumbnail = req.Thumbnail
	}
	if req.IsPublic != nil {
		note.IsPublic = *req.IsPublic
	}

	if err := s.repo.Update(ctx, note); err != nil {
		return nil, ErrInternalServerError
	}

	return note, nil
}

// DeleteNote deletes a note
func (s *noteService) DeleteNote(ctx context.Context, id uint) error {
	// Check if note exists
	_, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrNoteNotFound
		}
		return ErrInternalServerError
	}

	if err := s.repo.Delete(ctx, id); err != nil {
		return ErrInternalServerError
	}

	return nil
}

// ListNotes retrieves notes with pagination
func (s *noteService) ListNotes(ctx context.Context, params repository.NoteListParams) ([]*models.Note, int64, error) {
	notes, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, 0, ErrInternalServerError
	}
	return notes, total, nil
}

// GetNotesByUserID retrieves notes by user ID
func (s *noteService) GetNotesByUserID(ctx context.Context, userID uint, params repository.NoteListParams) ([]*models.Note, int64, error) {
	notes, total, err := s.repo.GetByUserID(ctx, userID, params)
	if err != nil {
		return nil, 0, ErrInternalServerError
	}
	return notes, total, nil
}

// AddTagToNote adds a tag to a note
func (s *noteService) AddTagToNote(ctx context.Context, noteID, tagID uint) error {
	// This would need to be implemented in the repository
	// For now, return not implemented
	return ErrNotImplemented
}

// RemoveTagFromNote removes a tag from a note
func (s *noteService) RemoveTagFromNote(ctx context.Context, noteID, tagID uint) error {
	// This would need to be implemented in the repository
	// For now, return not implemented
	return ErrNotImplemented
}
