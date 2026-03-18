package repository

import (
	"context"
	"errors"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/database"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
	"gorm.io/gorm"
)

var ErrVersionConflict = errors.New("version conflict")

// NoteRepository defines the interface for note data operations
type NoteRepository interface {
	Create(ctx context.Context, note *models.Note) error
	GetByID(ctx context.Context, id string) (*models.Note, error)
	Update(ctx context.Context, note *models.Note) error
	UpdateContentWithVersion(ctx context.Context, id string, content string, expectedVersion int) (*models.Note, error)
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, params NoteListParams) ([]*models.Note, int64, error)
	GetByUserID(ctx context.Context, userID string, params NoteListParams) ([]*models.Note, int64, error)
	UpdateTOM(ctx context.Context, id string, tom *int32) error
	ListTOM(ctx context.Context, userID string) ([]*models.Note, error)
}

// noteRepository implements NoteRepository
type noteRepository struct {
	db *database.DB
}

// NewNoteRepository creates a new note repository
func NewNoteRepository(db *database.DB) NoteRepository {
	return &noteRepository{db: db}
}

// Create creates a new note
func (r *noteRepository) Create(ctx context.Context, note *models.Note) error {
	return r.db.WithContext(ctx).Create(note).Error
}

// GetByID retrieves a note by ID
func (r *noteRepository) GetByID(ctx context.Context, id string) (*models.Note, error) {
	var note models.Note
	err := r.db.WithContext(ctx).
		Preload("User").
		Preload("Tags").
		Preload("Folder").
		Where("id = ?", id).
		First(&note).Error
	return &note, err
}

// Update updates a note
func (r *noteRepository) Update(ctx context.Context, note *models.Note) error {
	return r.db.WithContext(ctx).
		Omit("User", "Folder", "Tags").
		Save(note).Error
}

func (r *noteRepository) UpdateContentWithVersion(ctx context.Context, id string, content string, expectedVersion int) (*models.Note, error) {
	result := r.db.WithContext(ctx).
		Model(&models.Note{}).
		Where("id = ? AND version = ?", id, expectedVersion).
		Updates(map[string]interface{}{
			"content": content,
			"version": gorm.Expr("version + 1"),
		})

	if result.Error != nil {
		return nil, result.Error
	}

	if result.RowsAffected == 0 {
		var count int64
		if err := r.db.WithContext(ctx).Model(&models.Note{}).Where("id = ?", id).Count(&count).Error; err != nil {
			return nil, err
		}
		if count == 0 {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, ErrVersionConflict
	}

	note, err := r.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	return note, nil
}

// Delete deletes a note
func (r *noteRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&models.Note{}).Error
}

// List retrieves notes with pagination
func (r *noteRepository) List(ctx context.Context, params NoteListParams) ([]*models.Note, int64, error) {
	var notes []*models.Note
	var total int64

	query := r.db.WithContext(ctx).Model(&models.Note{})

	// Exclude top_of_mind notes from regular list
	query = query.Where("top_of_mind IS NULL")

	// Apply filters
	if params.Status != nil {
		query = query.Where("status = ?", *params.Status)
	}
	query = query.Where("folder_id = ?", *params.FolderID)
	if params.IsPublic != nil {
		query = query.Where("is_public = ?", *params.IsPublic)
	}

	// Count total (with all filters applied)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination and get results
	offset := (params.Page - 1) * params.Limit
	err := query.
		Preload("User").Preload("Tags").Preload("Folder").
		Offset(offset).Limit(params.Limit).
		Find(&notes).Error

	return notes, total, err
}

// GetByUserID retrieves notes by user ID (excludes top_of_mind notes)
func (r *noteRepository) GetByUserID(ctx context.Context, userID string, params NoteListParams) ([]*models.Note, int64, error) {
	var notes []*models.Note
	var total int64

	query := r.db.WithContext(ctx).Model(&models.Note{}).
		Where("user_id = ?", userID).
		Where("top_of_mind IS NULL")

	// Filter by folder - if nil, get root notes (folder_id IS NULL)
	if params.FolderID != nil {
		query = query.Where("folder_id = ?", *params.FolderID)
	} else {
		query = query.Where("folder_id IS NULL")
	}

	// Apply other filters
	if params.Status != nil {
		query = query.Where("status = ?", *params.Status)
	}

	// Count total (with all filters applied)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination and get results
	offset := (params.Page - 1) * params.Limit
	err := query.Preload("Tags").Preload("Folder").
		Offset(offset).Limit(params.Limit).Find(&notes).Error

	return notes, total, err
}

func (r *noteRepository) UpdateTOM(ctx context.Context, id string, tom *int32) error {
	return r.db.WithContext(ctx).
		Model(&models.Note{}).
		Where("id = ?", id).
		Update("top_of_mind", tom).Error
}

// ListTOM lists all notes where TopOfMind has an order for a specific user
func (r *noteRepository) ListTOM(ctx context.Context, userID string) ([]*models.Note, error) {
	var notes []*models.Note
	err := r.db.WithContext(ctx).
		Model(&models.Note{}).
		Where("top_of_mind IS NOT NULL AND user_id = ?", userID).
		Preload("Tags").
		Preload("Folder").
		Order("top_of_mind ASC").
		Order("updated_at DESC").
		Find(&notes).Error
	return notes, err
}
