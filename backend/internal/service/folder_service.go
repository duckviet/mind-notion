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
	ReorderFolders(ctx context.Context, userID string, parentID *string, folderIDs []string) error
	ListFolders(ctx context.Context, params repository.FolderListParams) ([]*models.Folder, int64, error)
	GetFoldersByUserID(ctx context.Context, userID string, params repository.FolderListParams) ([]*models.Folder, int64, error)
	AddNoteToFolder(ctx context.Context, folderID, noteID string) error
	RemoveNoteFromFolder(ctx context.Context, folderID, noteID string) error
}

// folderService implements FolderService
type folderService struct {
	repo     repository.FolderRepository
	noteRepo repository.NoteRepository
	config   *config.Config
}

// CreateFolderRequest represents the request to create a folder
type CreateFolderRequest struct {
	Name     string  `json:"name" validate:"required,min=1,max=100"`
	IsPublic bool    `json:"is_public"`
	UserID   string  `json:"user_id" validate:"required"`
	ParentID *string `json:"parent_id,omitempty"`
	Order    *int    `json:"order,omitempty"`
}

// UpdateFolderRequest represents the request to update a folder
type UpdateFolderRequest struct {
	Name     string  `json:"name,omitempty" validate:"omitempty,min=1,max=100"`
	IsPublic *bool   `json:"is_public,omitempty"`
	ParentID *string `json:"parent_id,omitempty"`
	Order    *int    `json:"order,omitempty"`
}

func normalizeParentID(parentID *string) *string {
	if parentID == nil {
		return nil
	}
	value := *parentID
	if value == "" {
		return nil
	}
	return &value
}

func sameParent(a *string, b *string) bool {
	aNorm := normalizeParentID(a)
	bNorm := normalizeParentID(b)

	if aNorm == nil && bNorm == nil {
		return true
	}
	if aNorm == nil || bNorm == nil {
		return false
	}
	return *aNorm == *bNorm
}

func clampOrder(order int, min int, max int) int {
	if order < min {
		return min
	}
	if order > max {
		return max
	}
	return order
}

func (s *folderService) normalizeParentOrders(ctx context.Context, userID string, parentID *string) error {
	return s.repo.NormalizeOrders(ctx, userID, normalizeParentID(parentID))
}

// NewFolderService creates a new folder service
func NewFolderService(repo repository.FolderRepository, noteRepo repository.NoteRepository, config *config.Config) FolderService {
	return &folderService{
		repo:     repo,
		noteRepo: noteRepo,
		config:   config,
	}
}

// CreateFolder creates a new folder
func (s *folderService) CreateFolder(ctx context.Context, req CreateFolderRequest) (*models.Folder, error) {
	targetParent := normalizeParentID(req.ParentID)

	// Validate parent folder exists if provided
	if targetParent != nil {
		_, err := s.repo.GetByID(ctx, *targetParent)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, ErrFolderNotFound
			}
			return nil, ErrInternalServerError
		}
	}

	if err := s.normalizeParentOrders(ctx, req.UserID, targetParent); err != nil {
		return nil, ErrInternalServerError
	}

	maxOrder, err := s.repo.GetMaxOrderByParent(ctx, req.UserID, targetParent)
	if err != nil {
		return nil, ErrInternalServerError
	}

	targetOrder := maxOrder + 1
	if req.Order != nil {
		targetOrder = clampOrder(*req.Order, 1, maxOrder+1)
	}

	folder := &models.Folder{
		Name:      req.Name,
		IsPublic:  req.IsPublic,
		UserID:    req.UserID,
		ParentID:  targetParent,
		SortOrder: maxOrder + 1,
	}

	if err := s.repo.Create(ctx, folder); err != nil {
		return nil, ErrInternalServerError
	}

	if targetOrder <= maxOrder {
		if err := s.repo.ShiftOrders(ctx, req.UserID, targetParent, targetOrder, maxOrder, 1, &folder.ID); err != nil {
			return nil, ErrInternalServerError
		}
		folder.SortOrder = targetOrder
		if err := s.repo.Update(ctx, folder); err != nil {
			return nil, ErrInternalServerError
		}
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

	oldParent := normalizeParentID(folder.ParentID)
	targetParent := oldParent
	if req.ParentID != nil {
		targetParent = normalizeParentID(req.ParentID)
	}

	// Validate parent folder exists if provided
	if targetParent != nil {
		_, err := s.repo.GetByID(ctx, *targetParent)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, ErrFolderNotFound
			}
			return nil, ErrInternalServerError
		}
	}

	if err := s.normalizeParentOrders(ctx, folder.UserID, oldParent); err != nil {
		return nil, ErrInternalServerError
	}
	if !sameParent(oldParent, targetParent) {
		if err := s.normalizeParentOrders(ctx, folder.UserID, targetParent); err != nil {
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

	parentChanged := !sameParent(oldParent, targetParent)
	currentOrder := folder.SortOrder
	newOrder := currentOrder

	if parentChanged {
		if err := s.repo.ShiftOrders(ctx, folder.UserID, oldParent, currentOrder+1, 0, -1, &folder.ID); err != nil {
			return nil, ErrInternalServerError
		}

		newParentMax, err := s.repo.GetMaxOrderByParent(ctx, folder.UserID, targetParent)
		if err != nil {
			return nil, ErrInternalServerError
		}

		newOrder = newParentMax + 1
		if req.Order != nil {
			newOrder = clampOrder(*req.Order, 1, newParentMax+1)
		}

		if newOrder <= newParentMax {
			if err := s.repo.ShiftOrders(ctx, folder.UserID, targetParent, newOrder, newParentMax, 1, nil); err != nil {
				return nil, ErrInternalServerError
			}
		}
	} else if req.Order != nil {
		maxOrder, err := s.repo.GetMaxOrderByParent(ctx, folder.UserID, oldParent)
		if err != nil {
			return nil, ErrInternalServerError
		}
		newOrder = clampOrder(*req.Order, 1, maxOrder)

		if newOrder < currentOrder {
			if err := s.repo.ShiftOrders(ctx, folder.UserID, oldParent, newOrder, currentOrder-1, 1, &folder.ID); err != nil {
				return nil, ErrInternalServerError
			}
		}
		if newOrder > currentOrder {
			if err := s.repo.ShiftOrders(ctx, folder.UserID, oldParent, currentOrder+1, newOrder, -1, &folder.ID); err != nil {
				return nil, ErrInternalServerError
			}
		}
	}

	folder.ParentID = targetParent
	folder.SortOrder = newOrder

	if err := s.repo.Update(ctx, folder); err != nil {
		return nil, ErrInternalServerError
	}

	return folder, nil
}

// DeleteFolder deletes a folder
func (s *folderService) DeleteFolder(ctx context.Context, id string) error {
	// Check if folder exists
	folder, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrFolderNotFound
		}
		return ErrInternalServerError
	}

	if err := s.repo.Delete(ctx, id); err != nil {
		return ErrInternalServerError
	}

	if err := s.repo.ShiftOrders(ctx, folder.UserID, folder.ParentID, folder.SortOrder+1, 0, -1, nil); err != nil {
		return ErrInternalServerError
	}

	return nil
}

func (s *folderService) ReorderFolders(ctx context.Context, userID string, parentID *string, folderIDs []string) error {
	if len(folderIDs) == 0 {
		return ErrInvalidFolderReorder
	}

	normalizedParent := normalizeParentID(parentID)

	siblings, err := s.repo.ListByUserAndParent(ctx, userID, normalizedParent)
	if err != nil {
		return ErrInternalServerError
	}

	if len(siblings) != len(folderIDs) {
		return ErrInvalidFolderReorder
	}

	validIDs := make(map[string]struct{}, len(siblings))
	for _, folder := range siblings {
		validIDs[folder.ID] = struct{}{}
	}

	seen := make(map[string]struct{}, len(folderIDs))
	for _, folderID := range folderIDs {
		if folderID == "" {
			return ErrInvalidFolderReorder
		}
		if _, exists := seen[folderID]; exists {
			return ErrInvalidFolderReorder
		}
		if _, exists := validIDs[folderID]; !exists {
			return ErrInvalidFolderReorder
		}
		seen[folderID] = struct{}{}
	}

	if err := s.repo.ReorderByIDs(ctx, userID, normalizedParent, folderIDs); err != nil {
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

// AddNoteToFolder adds a note to a folder by updating the note's folder_id
func (s *folderService) AddNoteToFolder(ctx context.Context, folderID, noteID string) error {
	// Check if folder exists
	_, err := s.repo.GetByID(ctx, folderID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrFolderNotFound
		}
		return ErrInternalServerError
	}

	// Get the note
	note, err := s.noteRepo.GetByID(ctx, noteID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrNoteNotFound
		}
		return ErrInternalServerError
	}

	// Update note's folder_id
	note.FolderID = &folderID
	if err := s.noteRepo.Update(ctx, note); err != nil {
		return ErrInternalServerError
	}

	return nil
}

// RemoveNoteFromFolder removes a note from a folder by setting folder_id to null
func (s *folderService) RemoveNoteFromFolder(ctx context.Context, folderID, noteID string) error {
	// Get the note
	note, err := s.noteRepo.GetByID(ctx, noteID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrNoteNotFound
		}
		return ErrInternalServerError
	}

	// Only remove if note is in the specified folder
	if note.FolderID != nil && *note.FolderID == folderID {
		note.FolderID = nil
		if err := s.noteRepo.Update(ctx, note); err != nil {
			return ErrInternalServerError
		}
	}

	return nil
}
