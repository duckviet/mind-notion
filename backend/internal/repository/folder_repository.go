package repository

import (
	"context"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/database"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
)

// FolderRepository defines the interface for folder data operations
type FolderRepository interface {
	Create(ctx context.Context, folder *models.Folder) error
	GetByID(ctx context.Context, id string) (*models.Folder, error)
	Update(ctx context.Context, folder *models.Folder) error
    Delete(ctx context.Context, id string) error
	List(ctx context.Context, params FolderListParams) ([]*models.Folder, int64, error)
	GetByUserID(ctx context.Context, userID string, params FolderListParams) ([]*models.Folder, int64, error)
	AddNoteToFolder(ctx context.Context, folderID, noteID string) error
	RemoveNoteFromFolder(ctx context.Context, folderID, noteID string) error
}

// folderRepository implements FolderRepository
type folderRepository struct {
	db *database.DB
}

// NewFolderRepository creates a new folder repository
func NewFolderRepository(db *database.DB) FolderRepository {
	return &folderRepository{db: db}
}

// Create creates a new folder
func (r *folderRepository) Create(ctx context.Context, folder *models.Folder) error {
	return r.db.WithContext(ctx).Create(folder).Error
}

// GetByID retrieves a folder by ID
func (r *folderRepository) GetByID(ctx context.Context, id string) (*models.Folder, error) {
	var folder models.Folder
    err := r.db.WithContext(ctx).
		Preload("User").
		Preload("Parent").
		Preload("Children").
		Preload("Notes").
        Where("id = ?", id).
        First(&folder).Error
	return &folder, err
}

// Update updates a folder
func (r *folderRepository) Update(ctx context.Context, folder *models.Folder) error {
	return r.db.WithContext(ctx).Save(folder).Error
}

// Delete deletes a folder
func (r *folderRepository) Delete(ctx context.Context, id string) error {
    return r.db.WithContext(ctx).Where("id = ?", id).Delete(&models.Folder{}).Error
}

// List retrieves folders with pagination
func (r *folderRepository) List(ctx context.Context, params FolderListParams) ([]*models.Folder, int64, error) {
	var folders []*models.Folder
	var total int64

	query := r.db.WithContext(ctx).Model(&models.Folder{})

	// Apply filters
	if params.ParentID != nil {
		if *params.ParentID == "" {
			query = query.Where("parent_id IS NULL")
		} else {
			query = query.Where("parent_id = ?", *params.ParentID)
		}
	}
	if params.IsPublic != nil {
		query = query.Where("is_public = ?", *params.IsPublic)
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination and get results
	offset := (params.Page - 1) * params.Limit
	err := query.Preload("User").Preload("Parent").
		Offset(offset).Limit(params.Limit).Find(&folders).Error

	return folders, total, err
}

// GetByUserID retrieves folders by user ID
func (r *folderRepository) GetByUserID(ctx context.Context, userID string, params FolderListParams) ([]*models.Folder, int64, error) {
	var folders []*models.Folder
	var total int64

    query := r.db.WithContext(ctx).Model(&models.Folder{}).Where("user_id = ?", userID)

	// Apply filters
	if params.ParentID != nil {
		if *params.ParentID == "" {
			query = query.Where("parent_id IS NULL")
		} else {
			query = query.Where("parent_id = ?", *params.ParentID)
		}
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination and get results
	offset := (params.Page - 1) * params.Limit
	err := query.Preload("Children").Preload("Notes").
		Offset(offset).Limit(params.Limit).Find(&folders).Error

	return folders, total, err
}

// AddNoteToFolder adds a note to a folder
func (r *folderRepository) AddNoteToFolder(ctx context.Context, folderID, noteID string) error {
	folderNote := &models.FolderNote{
		FolderID: folderID,
		NoteID:   noteID,
	}
	return r.db.WithContext(ctx).Create(folderNote).Error
}

// RemoveNoteFromFolder removes a note from a folder
func (r *folderRepository) RemoveNoteFromFolder(ctx context.Context, folderID, noteID string) error {
	return r.db.WithContext(ctx).
		Where("folder_id = ? AND note_id = ?", folderID, noteID).
		Delete(&models.FolderNote{}).Error
}
