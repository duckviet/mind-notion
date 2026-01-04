package service

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/repository"
)

// CommentService defines the interface for comment business logic
type CommentService interface {
	CreateComment(ctx context.Context, req CreateCommentRequest) (*CommentResponse, error)
	GetCommentByID(ctx context.Context, id string) (*CommentResponse, error)
	UpdateComment(ctx context.Context, id string, userID string, req UpdateCommentRequest) (*CommentResponse, error)
	DeleteComment(ctx context.Context, id string, userID string) error
	ListCommentsByNoteID(ctx context.Context, noteID string) ([]*CommentResponse, error)
}

// commentService implements CommentService
type commentService struct {
	repo     repository.CommentRepository
	noteRepo repository.NoteRepository
	userRepo repository.UserRepository
}

// CreateCommentRequest represents the request to create a comment
type CreateCommentRequest struct {
	NoteID  string `json:"note_id" validate:"required"`
	UserID  string `json:"user_id" validate:"required"`
	Content string `json:"content" validate:"required,min=1,max=1000"`
}

// UpdateCommentRequest represents the request to update a comment
type UpdateCommentRequest struct {
	Content string `json:"content" validate:"required,min=1,max=1000"`
}

// CommentResponse represents the response for a comment
type CommentResponse struct {
	ID         string `json:"id"`
	NoteID     string `json:"note_id"`
	UserID     string `json:"user_id"`
	UserName   string `json:"user_name"`
	UserAvatar string `json:"user_avatar,omitempty"`
	Content    string `json:"content"`
	CreatedAt  string `json:"created_at"`
	UpdatedAt  string `json:"updated_at"`
}

// NewCommentService creates a new comment service
func NewCommentService(repo repository.CommentRepository, noteRepo repository.NoteRepository, userRepo repository.UserRepository) CommentService {
	return &commentService{
		repo:     repo,
		noteRepo: noteRepo,
		userRepo: userRepo,
	}
}

// CreateComment creates a new comment
func (s *commentService) CreateComment(ctx context.Context, req CreateCommentRequest) (*CommentResponse, error) {
	// Verify note exists
	note, err := s.noteRepo.GetByID(ctx, req.NoteID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("note not found")
		}
		return nil, err
	}

	// Verify user exists
	user, err := s.userRepo.GetByID(ctx, req.UserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	// Create comment
	comment := &models.Comment{
		NoteID:  note.ID,
		UserID:  user.ID,
		Content: req.Content,
	}

	if err := s.repo.Create(ctx, comment); err != nil {
		return nil, err
	}

	// Load relationships
	comment, err = s.repo.GetByID(ctx, comment.ID)
	if err != nil {
		return nil, err
	}

	return s.toResponse(comment), nil
}

// GetCommentByID retrieves a comment by ID
func (s *commentService) GetCommentByID(ctx context.Context, id string) (*CommentResponse, error) {
	comment, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("comment not found")
		}
		return nil, err
	}

	return s.toResponse(comment), nil
}

// UpdateComment updates a comment
func (s *commentService) UpdateComment(ctx context.Context, id string, userID string, req UpdateCommentRequest) (*CommentResponse, error) {
	// Get existing comment
	comment, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("comment not found")
		}
		return nil, err
	}

	// Check ownership
	if comment.UserID != userID {
		return nil, errors.New("you don't have permission to update this comment")
	}

	// Update fields
	comment.Content = req.Content

	if err := s.repo.Update(ctx, comment); err != nil {
		return nil, err
	}

	// Reload to get updated data
	comment, err = s.repo.GetByID(ctx, comment.ID)
	if err != nil {
		return nil, err
	}

	return s.toResponse(comment), nil
}

// DeleteComment deletes a comment
func (s *commentService) DeleteComment(ctx context.Context, id string, userID string) error {
	// Get existing comment
	comment, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("comment not found")
		}
		return err
	}

	// Check ownership
	if comment.UserID != userID {
		return errors.New("you don't have permission to delete this comment")
	}

	return s.repo.Delete(ctx, id)
}

// ListCommentsByNoteID retrieves all comments for a note
func (s *commentService) ListCommentsByNoteID(ctx context.Context, noteID string) ([]*CommentResponse, error) {
	// Verify note exists
	_, err := s.noteRepo.GetByID(ctx, noteID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("note not found")
		}
		return nil, err
	}

	comments, err := s.repo.ListByNoteID(ctx, noteID)
	if err != nil {
		return nil, err
	}

	responses := make([]*CommentResponse, len(comments))
	for i, comment := range comments {
		responses[i] = s.toResponse(comment)
	}

	return responses, nil
}

// toResponse converts a comment model to a response
func (s *commentService) toResponse(comment *models.Comment) *CommentResponse {
	resp := &CommentResponse{
		ID:        comment.ID,
		NoteID:    comment.NoteID,
		UserID:    comment.UserID,
		Content:   comment.Content,
		CreatedAt: comment.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: comment.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	if comment.User.ID != "" {
		resp.UserName = comment.User.Name
		resp.UserAvatar = comment.User.Avatar
	}

	return resp
}
