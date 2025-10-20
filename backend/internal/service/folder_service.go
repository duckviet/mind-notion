package service

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/config"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/repository"
)

// FolderService defines the interface for folder business logic
type FolderService interface {
	CreateFolder(ctx context.Context, req CreateFolderRequest) (*models.Folder, error)
	GetFolderByID(ctx context.Context, id string) (*models.Folder, error)
	UpdateFolder(ctx context.Context, id string, req UpdateFolderRequest) (*models.Folder, error)
	DeleteFolder(ctx context.Context, id string) error
	ListFolders(ctx context.Context, params repository.FolderListParams) ([]*models.Folder, int64, error)
	GetFoldersByUserID(ctx context.Context, userID string, params repository.FolderListParams) ([]*models.Folder, int64, error)
	AddNoteToFolder(ctx context.Context, folderID, noteID string) error
	RemoveNoteFromFolder(ctx context.Context, folderID, noteID string) error
}

// folderService implements FolderService
type folderService struct {
	repo   repository.FolderRepository
	config *config.Config
}

// CreateFolderRequest represents the request to create a folder
type CreateFolderRequest struct {
	Name     string `json:"name" validate:"required,min=1,max=100"`
	IsPublic bool   `json:"is_public"`
	UserID   string   `json:"user_id" validate:"required"`
	ParentID *string  `json:"parent_id,omitempty"`
}

// UpdateFolderRequest represents the request to update a folder
type UpdateFolderRequest struct {
	Name     string `json:"name,omitempty" validate:"omitempty,min=1,max=100"`
	IsPublic *bool  `json:"is_public,omitempty"`
	ParentID *string  `json:"parent_id,omitempty"`
}

// NewFolderService creates a new folder service
func NewFolderService(repo repository.FolderRepository, config *config.Config) FolderService {
	return &folderService{
		repo:   repo,
		config: config,
	}
}

// CreateFolder creates a new folder
func (s *folderService) CreateFolder(ctx context.Context, req CreateFolderRequest) (*models.Folder, error) {
	// Validate parent folder exists if provided
	if req.ParentID != nil && *req.ParentID != "" {
		_, err := s.repo.GetByID(ctx, *req.ParentID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, ErrFolderNotFound
			}
			return nil, ErrInternalServerError
		}
	}

	folder := &models.Folder{
		Name:     req.Name,
		IsPublic: req.IsPublic,
		UserID:   req.UserID,
		ParentID: req.ParentID,
	}

	if err := s.repo.Create(ctx, folder); err != nil {
		return nil, ErrInternalServerError
	}

	return folder, nil
}

// GetFolderByID retrieves a folder by ID
func (s *folderService) GetFolderByID(ctx context.Context, id string) (*models.Folder, error) {
	folder, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrFolderNotFound
		}
		return nil, ErrInternalServerError
	}
	return folder, nil
}

// UpdateFolder updates a folder
func (s *folderService) UpdateFolder(ctx context.Context, id string, req UpdateFolderRequest) (*models.Folder, error) {
	folder, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrFolderNotFound
		}
		return nil, ErrInternalServerError
	}

	// Validate parent folder exists if provided
	if req.ParentID != nil && *req.ParentID != "" {
		_, err := s.repo.GetByID(ctx, *req.ParentID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, ErrFolderNotFound
			}
			return nil, ErrInternalServerError
		}
	}

	// Update fields
	if req.Name != "" {
		folder.Name = req.Name
	}
	if req.IsPublic != nil {
		folder.IsPublic = *req.IsPublic
	}
	if req.ParentID != nil {
		folder.ParentID = req.ParentID
	}

	if err := s.repo.Update(ctx, folder); err != nil {
		return nil, ErrInternalServerError
	}

	return folder, nil
}

// DeleteFolder deletes a folder
func (s *folderService) DeleteFolder(ctx context.Context, id string) error {
	// Check if folder exists
	_, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrFolderNotFound
		}
		return ErrInternalServerError
	}

	if err := s.repo.Delete(ctx, id); err != nil {
		return ErrInternalServerError
	}

	return nil
}

// ListFolders retrieves folders with pagination
func (s *folderService) ListFolders(ctx context.Context, params repository.FolderListParams) ([]*models.Folder, int64, error) {
	folders, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, 0, ErrInternalServerError
	}
	return folders, total, nil
}

// GetFoldersByUserID retrieves folders by user ID
func (s *folderService) GetFoldersByUserID(ctx context.Context, userID string, params repository.FolderListParams) ([]*models.Folder, int64, error) {
	folders, total, err := s.repo.GetByUserID(ctx, userID, params)
	if err != nil {
		return nil, 0, ErrInternalServerError
	}
	return folders, total, nil
}

// AddNoteToFolder adds a note to a folder
func (s *folderService) AddNoteToFolder(ctx context.Context, folderID, noteID string) error {
	if err := s.repo.AddNoteToFolder(ctx, folderID, noteID); err != nil {
		return ErrInternalServerError
	}
	return nil
}

// RemoveNoteFromFolder removes a note from a folder
func (s *folderService) RemoveNoteFromFolder(ctx context.Context, folderID, noteID string) error {
	if err := s.repo.RemoveNoteFromFolder(ctx, folderID, noteID); err != nil {
		return ErrInternalServerError
	}
	return nil
}
