package collaboration

import (
	"fmt"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/domain"
)

// DocumentUseCaseImpl implements DocumentUseCase
type DocumentUseCaseImpl struct {
	docRepo domain.DocumentRepository
}

// NewDocumentUseCase creates a new document use case
func NewDocumentUseCase(docRepo domain.DocumentRepository) *DocumentUseCaseImpl {
	return &DocumentUseCaseImpl{
		docRepo: docRepo,
	}
}

// GetDocument retrieves the current document
func (d *DocumentUseCaseImpl) GetDocument() (*domain.Document, error) {
	return d.docRepo.Get()
}

// UpdateDocument updates the document with optimistic locking
func (d *DocumentUseCaseImpl) UpdateDocument(update *domain.DocumentUpdate) (*domain.Document, error) {
	if err := d.docRepo.Update(update); err != nil {
		return nil, fmt.Errorf("failed to update document: %w", err)
	}
	
	// Return the updated document
	doc, err := d.docRepo.Get()
	if err != nil {
		return nil, fmt.Errorf("failed to get updated document: %w", err)
	}
	
	return doc, nil
}

// GetCurrentVersion returns the current document version
func (d *DocumentUseCaseImpl) GetCurrentVersion() (int, error) {
	return d.docRepo.GetVersion()
}
