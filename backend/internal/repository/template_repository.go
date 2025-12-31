package repository

import (
	"context"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/database"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
)

// TemplateRepository defines the interface for template data operations
type TemplateRepository interface {
	Create(ctx context.Context, template *models.Template) error
	GetByID(ctx context.Context, id string) (*models.Template, error)
	Update(ctx context.Context, template *models.Template) error
	Delete(ctx context.Context, id string) error
	ListByUserID(ctx context.Context, userID string) ([]*models.Template, error)
}

// templateRepository implements TemplateRepository
type templateRepository struct {
	db *database.DB
}

// NewTemplateRepository creates a new template repository
func NewTemplateRepository(db *database.DB) TemplateRepository {
	return &templateRepository{db: db}
}

// Create creates a new template
func (r *templateRepository) Create(ctx context.Context, template *models.Template) error {
	return r.db.WithContext(ctx).Create(template).Error
}

// GetByID retrieves a template by ID
func (r *templateRepository) GetByID(ctx context.Context, id string) (*models.Template, error) {
	var template models.Template
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("id = ?", id).
		First(&template).Error
	return &template, err
}

// Update updates a template
func (r *templateRepository) Update(ctx context.Context, template *models.Template) error {
	return r.db.WithContext(ctx).Save(template).Error
}

// Delete deletes a template
func (r *templateRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&models.Template{}).Error
}

// ListByUserID retrieves all templates for a specific user
func (r *templateRepository) ListByUserID(ctx context.Context, userID string) ([]*models.Template, error) {
	var templates []*models.Template
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&templates).Error
	return templates, err
}
