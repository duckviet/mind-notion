package collaboration

import (
	"fmt"
	"sync/atomic"
	"time"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/domain"
)

// UserUseCaseImpl implements UserUseCase
type UserUseCaseImpl struct {
	userRepo domain.UserRepository
	userSeq  uint64
}

// NewUserUseCase creates a new user use case
func NewUserUseCase(userRepo domain.UserRepository) *UserUseCaseImpl {
	return &UserUseCaseImpl{
		userRepo: userRepo,
	}
}

// CreateUser creates a new user with the given name
func (u *UserUseCaseImpl) CreateUser(name string) (*domain.User, error) {
	seq := atomic.AddUint64(&u.userSeq, 1)
	user := &domain.User{
		ID:    fmt.Sprintf("u-%d", seq),
		Name:  name,
		Color: u.colorFor(seq),
		Cursor: domain.Cursor{
			Index:  0,
			Length: 0,
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	
	if err := u.userRepo.Create(user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}
	
	return user, nil
}

// GetUser retrieves a user by ID
func (u *UserUseCaseImpl) GetUser(id string) (*domain.User, error) {
	return u.userRepo.GetByID(id)
}

// UpdateUser updates an existing user
func (u *UserUseCaseImpl) UpdateUser(user *domain.User) error {
	user.UpdatedAt = time.Now()
	return u.userRepo.Update(user)
}

// DeleteUser deletes a user by ID
func (u *UserUseCaseImpl) DeleteUser(id string) error {
	return u.userRepo.Delete(id)
}

// GetAllUsers returns all users
func (u *UserUseCaseImpl) GetAllUsers() ([]*domain.User, error) {
	return u.userRepo.List()
}

// UpdateCursor updates the cursor position for a user
func (u *UserUseCaseImpl) UpdateCursor(userID string, cursor domain.Cursor) error {
	user, err := u.userRepo.GetByID(userID)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}
	
	user.Cursor = cursor
	user.UpdatedAt = time.Now()
	
	return u.userRepo.Update(user)
}

// colorFor returns a color for the given sequence number
func (u *UserUseCaseImpl) colorFor(seq uint64) string {
	palette := []string{
		"#e11d48", "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#14b8a6", "#ef4444",
	}
	return palette[int(seq)%len(palette)]
}
