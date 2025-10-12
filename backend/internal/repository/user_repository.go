package repository

import (
	"fmt"
	"sync"
	"time"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/domain"
)

// InMemoryUserRepository implements UserRepository using in-memory storage
type InMemoryUserRepository struct {
	users map[string]*domain.User
	mu    sync.RWMutex
}

// NewInMemoryUserRepository creates a new in-memory user repository
func NewInMemoryUserRepository() *InMemoryUserRepository {
	return &InMemoryUserRepository{
		users: make(map[string]*domain.User),
	}
}

// Create creates a new user
func (r *InMemoryUserRepository) Create(user *domain.User) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	r.users[user.ID] = user
	return nil
}

// GetByID retrieves a user by ID
func (r *InMemoryUserRepository) GetByID(id string) (*domain.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	user, exists := r.users[id]
	if !exists {
		return nil, fmt.Errorf("user not found: %s", id)
	}
	return user, nil
}

// Update updates an existing user
func (r *InMemoryUserRepository) Update(user *domain.User) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	if _, exists := r.users[user.ID]; !exists {
		return fmt.Errorf("user not found: %s", user.ID)
	}
	
	user.UpdatedAt = time.Now()
	r.users[user.ID] = user
	return nil
}

// Delete deletes a user by ID
func (r *InMemoryUserRepository) Delete(id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	if _, exists := r.users[id]; !exists {
		return fmt.Errorf("user not found: %s", id)
	}
	
	delete(r.users, id)
	return nil
}

// List returns all users
func (r *InMemoryUserRepository) List() ([]*domain.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	users := make([]*domain.User, 0, len(r.users))
	for _, user := range r.users {
		users = append(users, user)
	}
	return users, nil
}
