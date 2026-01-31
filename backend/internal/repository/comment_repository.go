package repository

import (
	"context"

	"gorm.io/gorm"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/database"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
)

// CommentRepository defines the interface for comment data operations
type CommentRepository interface {
	Create(ctx context.Context, comment *models.Comment) error
	GetByID(ctx context.Context, id string) (*models.Comment, error)
	Update(ctx context.Context, comment *models.Comment) error
	Delete(ctx context.Context, id string) error
	ListByNoteID(ctx context.Context, noteID string) ([]*models.Comment, error)
}

// commentRepository implements CommentRepository
type commentRepository struct {
	db *database.DB
}

// NewCommentRepository creates a new comment repository
func NewCommentRepository(db *database.DB) CommentRepository {
	return &commentRepository{db: db}
}

// Create creates a new comment
func (r *commentRepository) Create(ctx context.Context, comment *models.Comment) error {
	return r.db.WithContext(ctx).Create(comment).Error
}

// GetByID retrieves a comment by ID
func (r *commentRepository) GetByID(ctx context.Context, id string) (*models.Comment, error) {
	var comment models.Comment
	err := r.db.WithContext(ctx).
		Preload("User").
		Preload("Replies", func(db *gorm.DB) *gorm.DB {
			return db.Preload("User").Order("created_at ASC")
		}).
		Where("id = ?", id).
		First(&comment).Error
	return &comment, err
}

// Update updates a comment
func (r *commentRepository) Update(ctx context.Context, comment *models.Comment) error {
	return r.db.WithContext(ctx).Save(comment).Error
}

// Delete deletes a comment by ID
func (r *commentRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&models.Comment{}, "id = ?", id).Error
}

// ListByNoteID retrieves all comments for a note
func (r *commentRepository) ListByNoteID(ctx context.Context, noteID string) ([]*models.Comment, error) {
	var comments []*models.Comment
	err := r.db.WithContext(ctx).
		Preload("User").
		Preload("Replies", func(db *gorm.DB) *gorm.DB {
			return db.Preload("User").Order("created_at ASC")
		}).
		Where("note_id = ?", noteID).
		Where("parent_id IS NULL").
		Order("created_at ASC").
		Find(&comments).Error
	return comments, err
}
