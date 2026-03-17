package repository

import (
	"context"
	"strings"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/database"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
	"gorm.io/gorm"
)

// FolderRepository defines the interface for folder data operations
type FolderRepository interface {
	Create(ctx context.Context, folder *models.Folder) error
	GetByID(ctx context.Context, id string) (*models.Folder, error)
	Update(ctx context.Context, folder *models.Folder) error
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, params FolderListParams) ([]*models.Folder, int64, error)
	GetByUserID(ctx context.Context, userID string, params FolderListParams) ([]*models.Folder, int64, error)
	ListByUserAndParent(ctx context.Context, userID string, parentID *string) ([]*models.Folder, error)
	GetMaxOrderByParent(ctx context.Context, userID string, parentID *string) (int, error)
	ShiftOrders(ctx context.Context, userID string, parentID *string, minOrder int, maxOrder int, delta int, excludeFolderID *string) error
	NormalizeOrders(ctx context.Context, userID string, parentID *string) error
	ReorderByIDs(ctx context.Context, userID string, parentID *string, orderedIDs []string) error
}

// folderRepository implements FolderRepository
type folderRepository struct {
	db *database.DB
}

func applyParentFilter(query *gorm.DB, parentID *string) *gorm.DB {
	if parentID == nil || *parentID == "" {
		return query.Where("parent_id IS NULL")
	}
	return query.Where("parent_id = ?", *parentID)
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
		Preload("Children", func(db *gorm.DB) *gorm.DB {
			return db.Order("order_index ASC").Order("created_at ASC")
		}).
		Preload("Notes").
		Where("id = ?", id).
		First(&folder).Error
	return &folder, err
}

// Update updates a folder
func (r *folderRepository) Update(ctx context.Context, folder *models.Folder) error {
	// Use map to explicitly set NULL values (GORM's Updates ignores nil pointers)
	// Use Table().Where() instead of Model() to avoid GORM using associations
	updates := map[string]interface{}{
		"name":        folder.Name,
		"is_public":   folder.IsPublic,
		"parent_id":   folder.ParentID, // This will set NULL when ParentID is nil
		"order_index": folder.SortOrder,
		"updated_at":  folder.UpdatedAt,
	}
	result := r.db.WithContext(ctx).Table("folders").Where("id = ?", folder.ID).Updates(updates)
	return result.Error
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
		Order("order_index ASC").Order("created_at ASC").
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
	err := query.Preload("Children", func(db *gorm.DB) *gorm.DB {
		return db.Order("order_index ASC").Order("created_at ASC")
	}).Preload("Notes").Order("order_index ASC").Order("created_at ASC").
		Offset(offset).Limit(params.Limit).Find(&folders).Error

	return folders, total, err
}

func (r *folderRepository) ListByUserAndParent(ctx context.Context, userID string, parentID *string) ([]*models.Folder, error) {
	var folders []*models.Folder

	query := r.db.WithContext(ctx).Model(&models.Folder{}).Where("user_id = ?", userID)
	query = applyParentFilter(query, parentID)

	err := query.
		Order("order_index ASC").
		Order("created_at ASC").
		Order("id ASC").
		Find(&folders).Error

	return folders, err
}

func (r *folderRepository) GetMaxOrderByParent(ctx context.Context, userID string, parentID *string) (int, error) {
	query := r.db.WithContext(ctx).Model(&models.Folder{}).Where("user_id = ?", userID)
	query = applyParentFilter(query, parentID)

	var maxOrder int
	err := query.Select("COALESCE(MAX(order_index), 0)").Scan(&maxOrder).Error
	if err != nil {
		return 0, err
	}

	return maxOrder, nil
}

func (r *folderRepository) ShiftOrders(ctx context.Context, userID string, parentID *string, minOrder int, maxOrder int, delta int, excludeFolderID *string) error {
	if delta == 0 {
		return nil
	}

	query := r.db.WithContext(ctx).Model(&models.Folder{}).Where("user_id = ?", userID)
	query = applyParentFilter(query, parentID)

	if minOrder > 0 {
		query = query.Where("order_index >= ?", minOrder)
	}
	if maxOrder > 0 {
		query = query.Where("order_index <= ?", maxOrder)
	}
	if excludeFolderID != nil && *excludeFolderID != "" {
		query = query.Where("id <> ?", *excludeFolderID)
	}

	return query.Update("order_index", gorm.Expr("order_index + ?", delta)).Error
}

func (r *folderRepository) NormalizeOrders(ctx context.Context, userID string, parentID *string) error {
	var siblings []*models.Folder

	query := r.db.WithContext(ctx).Model(&models.Folder{}).Where("user_id = ?", userID)
	query = applyParentFilter(query, parentID)

	if err := query.Order("order_index ASC").Order("created_at ASC").Order("id ASC").Find(&siblings).Error; err != nil {
		return err
	}

	for idx, folder := range siblings {
		desired := idx + 1
		if folder.SortOrder == desired {
			continue
		}

		if err := r.db.WithContext(ctx).
			Table("folders").
			Where("id = ?", folder.ID).
			Update("order_index", desired).Error; err != nil {
			return err
		}
	}

	return nil
}

func (r *folderRepository) ReorderByIDs(ctx context.Context, userID string, parentID *string, orderedIDs []string) error {
	if len(orderedIDs) == 0 {
		return nil
	}

	var builder strings.Builder
	args := make([]interface{}, 0, (len(orderedIDs)*3)+2)

	builder.WriteString("UPDATE folders SET order_index = CASE id ")
	for idx, folderID := range orderedIDs {
		builder.WriteString("WHEN ? THEN CAST(? AS BIGINT) ")
		args = append(args, folderID, idx+1)
	}
	builder.WriteString("ELSE order_index END WHERE user_id = ? ")
	args = append(args, userID)

	if parentID == nil || *parentID == "" {
		builder.WriteString("AND parent_id IS NULL ")
	} else {
		builder.WriteString("AND parent_id = ? ")
		args = append(args, *parentID)
	}

	builder.WriteString("AND id IN (")
	for idx, folderID := range orderedIDs {
		if idx > 0 {
			builder.WriteString(",")
		}
		builder.WriteString("?")
		args = append(args, folderID)
	}
	builder.WriteString(")")

	return r.db.WithContext(ctx).Exec(builder.String(), args...).Error
}
