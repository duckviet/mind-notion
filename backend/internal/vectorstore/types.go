package vectorstore

import "context"

// Document represents a document to be stored in the vector store
type Document struct {
	ID       string            // Unique identifier
	Vector   []float32         // Embedding vector
	Metadata map[string]string // Additional metadata (user_id, title, etc.)
}

// SearchResult represents a search result from the vector store
type SearchResult struct {
	ID       string            // Document ID
	Score    float32           // Similarity score
	Metadata map[string]string // Document metadata
}

// VectorStore defines the interface for vector database operations
type VectorStore interface {
	// Upsert inserts or updates documents in the vector store
	Upsert(ctx context.Context, docs []Document) error

	// Search performs a similarity search and returns top-k results
	Search(ctx context.Context, vector []float32, topK int, filter map[string]string) ([]SearchResult, error)

	// Delete removes documents by their IDs
	Delete(ctx context.Context, ids []string) error

	// Close closes the connection to the vector store
	Close() error
}

