package collaboration

import (
	"testing"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/domain"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/repository"
)

func TestCollaborationService(t *testing.T) {
	// Initialize repositories
	userRepo := repository.NewInMemoryUserRepository()
	docRepo := repository.NewInMemoryDocumentRepository()
	clientRepo := repository.NewInMemoryClientRepository()

	// Initialize collaboration service
	service := NewCollaborationService(userRepo, docRepo, clientRepo)

	// Test user creation
	user, err := service.userUseCase.CreateUser("Test User")
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	if user.Name != "Test User" {
		t.Errorf("Expected user name 'Test User', got '%s'", user.Name)
	}

	if user.ID == "" {
		t.Error("Expected user ID to be set")
	}

	// Test document operations
	doc, err := service.docUseCase.GetDocument()
	if err != nil {
		t.Fatalf("Failed to get document: %v", err)
	}

	if doc == nil {
		t.Error("Expected document to be initialized")
	}

	// Test document update
	update := &domain.DocumentUpdate{
		Content: "Hello, World!",
		Version: doc.Version,
	}

	updatedDoc, err := service.docUseCase.UpdateDocument(update)
	if err != nil {
		t.Fatalf("Failed to update document: %v", err)
	}

	if updatedDoc.Content != "Hello, World!" {
		t.Errorf("Expected content 'Hello, World!', got '%s'", updatedDoc.Content)
	}

	if updatedDoc.Version != doc.Version+1 {
		t.Errorf("Expected version %d, got %d", doc.Version+1, updatedDoc.Version)
	}
}
