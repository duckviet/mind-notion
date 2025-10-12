package domain

import "time"

// Document represents a collaborative document
type Document struct {
	ID        string    `json:"id"`
	Content   string    `json:"content"`
	Version   int       `json:"version"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// DocumentUpdate represents an update to a document
type DocumentUpdate struct {
	Content string `json:"content"`
	Version int    `json:"version"`
}

// DocumentRepository defines the interface for document data operations
type DocumentRepository interface {
	Get() (*Document, error)
	Update(update *DocumentUpdate) error
	GetVersion() (int, error)
}

// DocumentUseCase defines the interface for document business logic
type DocumentUseCase interface {
	GetDocument() (*Document, error)
	UpdateDocument(update *DocumentUpdate) (*Document, error)
	GetCurrentVersion() (int, error)
}
