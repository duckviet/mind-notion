package service

import (
	"context"
	"errors"
	"strings"

	"gorm.io/gorm"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/repository"
)

// TemplateService defines the interface for template business logic
type TemplateService interface {
	CreateTemplate(ctx context.Context, req CreateTemplateRequest) (*models.Template, error)
	GetTemplateByID(ctx context.Context, id string) (*models.Template, error)
	UpdateTemplate(ctx context.Context, id string, req UpdateTemplateRequest) (*models.Template, error)
	DeleteTemplate(ctx context.Context, id string) error
	ListTemplatesByUserID(ctx context.Context, userID string) ([]*models.Template, error)
}

// templateService implements TemplateService
type templateService struct {
	repo repository.TemplateRepository
}

// CreateTemplateRequest represents the request to create a template
type CreateTemplateRequest struct {
	Name    string   `json:"name" validate:"required,min=1,max=100"`
	Icon    string   `json:"icon" validate:"required"`
	Content string   `json:"content" validate:"required"`
	Tags    []string `json:"tags"`
	Color   string   `json:"color"`
	UserID  string   `json:"user_id" validate:"required"`
}

// UpdateTemplateRequest represents the request to update a template
type UpdateTemplateRequest struct {
	Name    string   `json:"name,omitempty" validate:"omitempty,min=1,max=100"`
	Icon    string   `json:"icon,omitempty"`
	Content string   `json:"content,omitempty"`
	Tags    []string `json:"tags"`
	Color   string   `json:"color,omitempty"`
}

// NewTemplateService creates a new template service
func NewTemplateService(repo repository.TemplateRepository) TemplateService {
	return &templateService{
		repo: repo,
	}
}

// CreateTemplate creates a new template
func (s *templateService) CreateTemplate(ctx context.Context, req CreateTemplateRequest) (*models.Template, error) {
	// Set defaults
	if req.Icon == "" {
		req.Icon = "FileText"
	}

	template := &models.Template{
		Name:    req.Name,
		Icon:    req.Icon,
		Content: req.Content,
		Tags:    strings.Join(req.Tags, ","),
		Color:   req.Color,
		UserID:  req.UserID,
	}

	if err := s.repo.Create(ctx, template); err != nil {
		return nil, ErrInternalServerError
	}

	return template, nil
}

// GetTemplateByID retrieves a template by ID
func (s *templateService) GetTemplateByID(ctx context.Context, id string) (*models.Template, error) {
	template, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTemplateNotFound
		}
		return nil, ErrInternalServerError
	}
	return template, nil
}

// UpdateTemplate updates a template
func (s *templateService) UpdateTemplate(ctx context.Context, id string, req UpdateTemplateRequest) (*models.Template, error) {
	template, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTemplateNotFound
		}
		return nil, ErrInternalServerError
	}

	// Update fields
	if req.Name != "" {
		template.Name = req.Name
	}
	if req.Icon != "" {
		template.Icon = req.Icon
	}
	if req.Content != "" {
		template.Content = req.Content
	}
	if req.Tags != nil {
		template.Tags = strings.Join(req.Tags, ",")
	}
	if req.Color != "" {
		template.Color = req.Color
	}

	if err := s.repo.Update(ctx, template); err != nil {
		return nil, ErrInternalServerError
	}

	return template, nil
}

// DeleteTemplate deletes a template
func (s *templateService) DeleteTemplate(ctx context.Context, id string) error {
	_, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrTemplateNotFound
		}
		return ErrInternalServerError
	}

	if err := s.repo.Delete(ctx, id); err != nil {
		return ErrInternalServerError
	}

	return nil
}

// ListTemplatesByUserID retrieves all templates for a user
func (s *templateService) ListTemplatesByUserID(ctx context.Context, userID string) ([]*models.Template, error) {
	templates, err := s.repo.ListByUserID(ctx, userID)
	if err != nil {
		return nil, ErrInternalServerError
	}
	return templates, nil
}
