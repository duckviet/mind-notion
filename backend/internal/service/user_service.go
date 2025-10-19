package service

import (
	"context"
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/config"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/repository"
)

// UserService defines the interface for user business logic
type UserService interface {
	CreateUser(ctx context.Context, req CreateUserRequest) (*models.User, error)
	GetUserByID(ctx context.Context, id uint) (*models.User, error)
	GetUserByUsername(ctx context.Context, username string) (*models.User, error)
	GetUserByEmail(ctx context.Context, email string) (*models.User, error)
	UpdateUser(ctx context.Context, id uint, req UpdateUserRequest) (*models.User, error)
	DeleteUser(ctx context.Context, id uint) error
	ListUsers(ctx context.Context, params repository.ListParams) ([]*models.User, int64, error)
	Authenticate(ctx context.Context, email, password string) (*models.User, error)
	UpdateLastLogin(ctx context.Context, userID uint) error
}

// userService implements UserService
type userService struct {
	repo   repository.UserRepository
	config *config.Config
}

// CreateUserRequest represents the request to create a user
type CreateUserRequest struct {
	Username string `json:"username" validate:"required,min=3,max=50"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
	Name     string `json:"name" validate:"required,min=2,max=100"`
	Avatar   string `json:"avatar,omitempty"`
}

// UpdateUserRequest represents the request to update a user
type UpdateUserRequest struct {
	Name   string `json:"name,omitempty" validate:"omitempty,min=2,max=100"`
	Avatar string `json:"avatar,omitempty"`
}

// NewUserService creates a new user service
func NewUserService(repo repository.UserRepository, config *config.Config) UserService {
	return &userService{
		repo:   repo,
		config: config,
	}
}

// CreateUser creates a new user
func (s *userService) CreateUser(ctx context.Context, req CreateUserRequest) (*models.User, error) {
	// Check if user already exists
	_, err := s.repo.GetByEmail(ctx, req.Email)
	if err == nil {
		return nil, ErrUserAlreadyExists
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrInternalServerError
	}

	// Check username uniqueness
	_, err = s.repo.GetByUsername(ctx, req.Username)
	if err == nil {
		return nil, ErrUsernameAlreadyExists
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrInternalServerError
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, ErrInternalServerError
	}

	// Create user
	user := &models.User{
		Username: req.Username,
		Email:    req.Email,
		Password: string(hashedPassword),
		Name:     req.Name,
		Avatar:   req.Avatar,
		Status:   models.UserStatusActive,
	}

	if err := s.repo.Create(ctx, user); err != nil {
		return nil, ErrInternalServerError
	}

	return user, nil
}

// GetUserByID retrieves a user by ID
func (s *userService) GetUserByID(ctx context.Context, id uint) (*models.User, error) {
	user, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, ErrInternalServerError
	}
	return user, nil
}

// GetUserByUsername retrieves a user by username
func (s *userService) GetUserByUsername(ctx context.Context, username string) (*models.User, error) {
	user, err := s.repo.GetByUsername(ctx, username)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, ErrInternalServerError
	}
	return user, nil
}

// GetUserByEmail retrieves a user by email
func (s *userService) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	user, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, ErrInternalServerError
	}
	return user, nil
}

// UpdateUser updates a user
func (s *userService) UpdateUser(ctx context.Context, id uint, req UpdateUserRequest) (*models.User, error) {
	user, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, ErrInternalServerError
	}

	// Update fields
	if req.Name != "" {
		user.Name = req.Name
	}
	if req.Avatar != "" {
		user.Avatar = req.Avatar
	}

	if err := s.repo.Update(ctx, user); err != nil {
		return nil, ErrInternalServerError
	}

	return user, nil
}

// DeleteUser deletes a user
func (s *userService) DeleteUser(ctx context.Context, id uint) error {
	// Check if user exists
	_, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrUserNotFound
		}
		return ErrInternalServerError
	}

	if err := s.repo.Delete(ctx, id); err != nil {
		return ErrInternalServerError
	}

	return nil
}

// ListUsers retrieves users with pagination
func (s *userService) ListUsers(ctx context.Context, params repository.ListParams) ([]*models.User, int64, error) {
	users, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, 0, ErrInternalServerError
	}
	return users, total, nil
}

// Authenticate authenticates a user with email and password
func (s *userService) Authenticate(ctx context.Context, email, password string) (*models.User, error) {
	user, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, ErrInternalServerError
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	// Check user status
	if user.Status != models.UserStatusActive {
		return nil, ErrUserInactive
	}

	return user, nil
}

// UpdateLastLogin updates the last login time for a user
func (s *userService) UpdateLastLogin(ctx context.Context, userID uint) error {
	user, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		return err
	}

	now := time.Now()
	user.LastLoginAt = &now

	return s.repo.Update(ctx, user)
}
