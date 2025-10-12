package repository

import (
	"fmt"
	"sync"
	"time"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/domain"
)

// InMemoryDocumentRepository implements DocumentRepository using in-memory storage
type InMemoryDocumentRepository struct {
	document *domain.Document
	mu       sync.RWMutex
}

// NewInMemoryDocumentRepository creates a new in-memory document repository
func NewInMemoryDocumentRepository() *InMemoryDocumentRepository {
	return &InMemoryDocumentRepository{
		document: &domain.Document{
			ID:        "default",
			Content:   "",
			Version:   0,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
	}
}

// Get retrieves the current document
func (r *InMemoryDocumentRepository) Get() (*domain.Document, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	// Return a copy to prevent external modifications
	doc := *r.document
	return &doc, nil
}

// Update updates the document with the provided update
func (r *InMemoryDocumentRepository) Update(update *domain.DocumentUpdate) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	// Check version for optimistic locking
	if update.Version != r.document.Version {
		return fmt.Errorf("version mismatch: expected %d, got %d", r.document.Version, update.Version)
	}
	
	r.document.Content = update.Content
	r.document.Version++
	r.document.UpdatedAt = time.Now()
	return nil
}

// GetVersion returns the current document version
func (r *InMemoryDocumentRepository) GetVersion() (int, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	return r.document.Version, nil
}
