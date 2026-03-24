package service

import (
	"context"
	"errors"
	"log"
	"strings"

	"gorm.io/gorm"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/config"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/repository"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/utils"
	"github.com/google/uuid"
)

// NoteService defines the interface for note business logic
type NoteService interface {
	CreateNote(ctx context.Context, req CreateNoteRequest) (*models.Note, error)
	GetNoteByID(ctx context.Context, id string) (*models.Note, error)
	UpdateNote(ctx context.Context, id string, req UpdateNoteRequest) (*models.Note, error)
	UpdateNoteContentWithVersion(ctx context.Context, id string, content string, expectedVersion int) (*models.Note, error)
	DeleteNote(ctx context.Context, id string) error
	ListNotes(ctx context.Context, params repository.NoteListParams, userID string) ([]*models.Note, int64, error)
	GetNotesByUserID(ctx context.Context, userID string, params repository.NoteListParams) ([]*models.Note, int64, error)
	AddTagToNote(ctx context.Context, noteID, tagID string) error
	RemoveTagFromNote(ctx context.Context, noteID, tagID string) error
	UpdateNoteTOM(ctx context.Context, id string, tom *int32) (*models.Note, error)
	ListNotesTOM(ctx context.Context, userID string) ([]*models.Note, error)
	UpdatePublicEditSettings(ctx context.Context, id string, enabled bool) (*models.Note, error)
	RotatePublicEditToken(ctx context.Context, id string) (*models.Note, error)
	SaveNoteSnapshot(ctx context.Context, id string, content string) (*models.Note, error)
	SaveNoteTiptapSnapshot(ctx context.Context, id string, tiptapContent string) (*models.Note, error)
}

// noteService implements NoteService
type noteService struct {
	repo            repository.NoteRepository
	config          *config.Config
	searchService   SearchService
	chunkingService ChunkingService
}

// CreateNoteRequest represents the request to create a note
type CreateNoteRequest struct {
	Title       string  `json:"title" validate:"required,min=1,max=200"`
	Content     string  `json:"content"`
	ContentType string  `json:"content_type" validate:"omitempty,oneof=text markdown html"`
	Status      string  `json:"status" validate:"omitempty,oneof=draft published archived"`
	Thumbnail   string  `json:"thumbnail,omitempty"`
	FolderID    *string `json:"folder_id,omitempty"`
	IsPublic    bool    `json:"is_public"`
	UserID      string  `json:"user_id" validate:"required"`
	TagIDs      []uint  `json:"tag_ids,omitempty"`
}

// UpdateNoteRequest represents the request to update a note
type UpdateNoteRequest struct {
	Title          string  `json:"title,omitempty" validate:"omitempty,min=1,max=200"`
	Content        string  `json:"content,omitempty"`
	ContentType    string  `json:"content_type,omitempty" validate:"omitempty,oneof=text markdown html"`
	Status         string  `json:"status,omitempty" validate:"omitempty,oneof=draft published archived"`
	Thumbnail      string  `json:"thumbnail,omitempty"`
	FolderID       *string `json:"folder_id,omitempty"`
	UpdateFolderID bool    `json:"-"` // Internal flag to indicate folder_id should be updated
	IsPublic       *bool   `json:"is_public,omitempty"`
	TagIDs         []uint  `json:"tag_ids,omitempty"`
}

// NewNoteService creates a new note service
func NewNoteService(repo repository.NoteRepository, config *config.Config, searchService SearchService, chunkingService ChunkingService) NoteService {
	return &noteService{
		repo:            repo,
		config:          config,
		searchService:   searchService,
		chunkingService: chunkingService,
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
		TopOfMind:   nil,
		Thumbnail:   req.Thumbnail,
		FolderID:    req.FolderID,
		IsPublic:    req.IsPublic,
		UserID:      req.UserID,
	}

	if err := s.repo.Create(ctx, note); err != nil {
		return nil, ErrInternalServerError
	}

	// Index the note in vector store if search service is available
	if s.searchService != nil {
		if err := s.searchService.IndexNote(ctx, note); err != nil {
			log.Printf("Warning: failed to index note %s: %v", note.ID, err)
		}
	}

	if s.chunkingService != nil {
		s.chunkingService.DispatchNoteSaved(ctx, note, "note.create")
	}

	return note, nil
}

// GetNoteByID retrieves a note by ID
func (s *noteService) GetNoteByID(ctx context.Context, id string) (*models.Note, error) {
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
func (s *noteService) UpdateNote(ctx context.Context, id string, req UpdateNoteRequest) (*models.Note, error) {
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
	if req.UpdateFolderID {
		oldVal := "nil"
		if note.FolderID != nil {
			oldVal = *note.FolderID
		}
		newVal := "nil"
		if req.FolderID != nil {
			newVal = *req.FolderID
		}
		log.Printf("DEBUG: Updating FolderID from '%s' to '%s'", oldVal, newVal)
		note.FolderID = req.FolderID
	}
	if req.IsPublic != nil {
		note.IsPublic = *req.IsPublic
	}

	if err := s.repo.Update(ctx, note); err != nil {
		return nil, ErrInternalServerError
	}

	if s.chunkingService != nil {
		s.chunkingService.DispatchNoteSaved(ctx, note, "note.update")
	}

	return note, nil
}

func (s *noteService) UpdateNoteContentWithVersion(ctx context.Context, id string, content string, expectedVersion int) (*models.Note, error) {
	note, err := s.repo.UpdateContentWithVersion(ctx, id, content, expectedVersion)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNoteNotFound
		}
		if errors.Is(err, repository.ErrVersionConflict) {
			return nil, ErrVersionConflict
		}
		return nil, ErrInternalServerError
	}

	return note, nil
}

// DeleteNote deletes a note
func (s *noteService) DeleteNote(ctx context.Context, id string) error {
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
func (s *noteService) ListNotes(ctx context.Context, params repository.NoteListParams, userID string) ([]*models.Note, int64, error) {
	if params.Query != nil {
		notes, total, err := s.searchService.SearchNotes(ctx, *params.Query, userID, params.Limit)
		if err != nil {
			return nil, 0, err
		}
		utils.FormatNotePreviews(notes, utils.DefaultNotePreviewLength)
		return notes, total, nil
	}

	notes, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, 0, ErrInternalServerError
	}

	utils.FormatNotePreviews(notes, utils.DefaultNotePreviewLength)
	return notes, total, nil
}

// GetNotesByUserID retrieves notes by user ID
func (s *noteService) GetNotesByUserID(ctx context.Context, userID string, params repository.NoteListParams) ([]*models.Note, int64, error) {
	if params.Query != nil && *params.Query != "" {
		notes, total, err := s.searchService.SearchNotes(ctx, *params.Query, userID, params.Limit)
		if err != nil {
			return nil, 0, err
		}
		utils.FormatNotePreviews(notes, utils.DefaultNotePreviewLength)
		return notes, total, nil
	}

	notes, total, err := s.repo.GetByUserID(ctx, userID, params)
	if err != nil {
		return nil, 0, ErrInternalServerError
	}

	utils.FormatNotePreviews(notes, utils.DefaultNotePreviewLength)
	return notes, total, nil
}

// AddTagToNote adds a tag to a note
func (s *noteService) AddTagToNote(ctx context.Context, noteID, tagID string) error {
	// This would need to be implemented in the repository
	// For now, return not implemented
	return ErrNotImplemented
}

// RemoveTagFromNote removes a tag from a note
func (s *noteService) RemoveTagFromNote(ctx context.Context, noteID, tagID string) error {
	// This would need to be implemented in the repository
	// For now, return not implemented
	return ErrNotImplemented
}

// UpdateNoteTOM updates a note top of mind by ID
func (s *noteService) UpdateNoteTOM(ctx context.Context, id string, tom *int32) (*models.Note, error) {
	note, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNoteNotFound
		}
		return nil, ErrInternalServerError
	}

	tomNotes, err := s.repo.ListTOM(ctx, note.UserID)
	if err != nil {
		return nil, ErrInternalServerError
	}

	orderedNotes := make([]*models.Note, 0, len(tomNotes))
	for _, tomNote := range tomNotes {
		if tomNote.ID == note.ID {
			continue
		}
		orderedNotes = append(orderedNotes, tomNote)
	}

	if tom != nil {
		targetOrder := int(*tom)
		if targetOrder < 1 {
			targetOrder = 1
		}

		maxOrder := len(orderedNotes) + 1
		if targetOrder > maxOrder {
			targetOrder = maxOrder
		}

		targetIndex := targetOrder - 1
		orderedNotes = append(orderedNotes, nil)
		copy(orderedNotes[targetIndex+1:], orderedNotes[targetIndex:])
		orderedNotes[targetIndex] = note
	}

	for index, orderedNote := range orderedNotes {
		desiredOrder := int32(index + 1)
		if orderedNote.TopOfMind != nil && *orderedNote.TopOfMind == desiredOrder {
			continue
		}

		orderToPersist := desiredOrder
		if err := s.repo.UpdateTOM(ctx, orderedNote.ID, &orderToPersist); err != nil {
			return nil, ErrInternalServerError
		}
	}

	if tom == nil && note.TopOfMind != nil {
		if err := s.repo.UpdateTOM(ctx, note.ID, nil); err != nil {
			return nil, ErrInternalServerError
		}
	}

	updatedNote, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNoteNotFound
		}
		return nil, ErrInternalServerError
	}

	// Format preview for TOM note as well
	utils.FormatNotePreviews([]*models.Note{updatedNote}, utils.DefaultNotePreviewLength)
	return updatedNote, nil
}

func (s *noteService) ListNotesTOM(ctx context.Context, userID string) ([]*models.Note, error) {
	notes, err := s.repo.ListTOM(ctx, userID)
	if err != nil {
		return nil, ErrInternalServerError
	}
	utils.FormatNotePreviews(notes, utils.DefaultNotePreviewLength)
	return notes, nil
}

// UpdatePublicEditSettings toggles public edit access for a note.
func (s *noteService) UpdatePublicEditSettings(ctx context.Context, id string, enabled bool) (*models.Note, error) {
	note, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNoteNotFound
		}
		return nil, ErrInternalServerError
	}

	if note.PublicEditToken == "" {
		note.PublicEditToken = generatePublicEditToken()
	}
	note.PublicEditEnabled = enabled

	if err := s.repo.Update(ctx, note); err != nil {
		return nil, ErrInternalServerError
	}

	return note, nil
}

// RotatePublicEditToken regenerates the edit token for a note.
func (s *noteService) RotatePublicEditToken(ctx context.Context, id string) (*models.Note, error) {
	note, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNoteNotFound
		}
		return nil, ErrInternalServerError
	}

	note.PublicEditToken = generatePublicEditToken()
	if err := s.repo.Update(ctx, note); err != nil {
		return nil, ErrInternalServerError
	}

	return note, nil
}

// SaveNoteSnapshot updates the persisted HTML content for a note.
func (s *noteService) SaveNoteSnapshot(ctx context.Context, id string, content string) (*models.Note, error) {
	note, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNoteNotFound
		}
		return nil, ErrInternalServerError
	}

	note.Content = content
	if err := s.repo.Update(ctx, note); err != nil {
		return nil, ErrInternalServerError
	}

	if s.chunkingService != nil {
		s.chunkingService.DispatchNoteSaved(ctx, note, "note.snapshot")
	}

	return note, nil
}

// SaveNoteTiptapSnapshot updates the persisted Tiptap JSON content for a note.
func (s *noteService) SaveNoteTiptapSnapshot(ctx context.Context, id string, tiptapContent string) (*models.Note, error) {
	note, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNoteNotFound
		}
		return nil, ErrInternalServerError
	}

	note.TiptapContent = tiptapContent
	if err := s.repo.Update(ctx, note); err != nil {
		return nil, ErrInternalServerError
	}

	if s.chunkingService != nil {
		s.chunkingService.DispatchNoteSaved(ctx, note, "note.snapshot.tiptap")
	}

	return note, nil
}

func generatePublicEditToken() string {
	return strings.ReplaceAll(uuid.NewString(), "-", "")
}
