package vectorstore

import "context"

// Document represents a document to be stored in the vector store
type InsertVectorDocument struct {
	ID       string            // Unique identifier
	Vector   []float32         // Embedding vector
	Metadata map[string]string // Additional metadata (user_id, title, etc.)
}
type InsertTextDocument struct {
	ID       string   // Unique identifier
	Text     string   // Text to be stored
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
	Upsert(ctx context.Context, docs []InsertVectorDocument) error
	UpsertText(ctx context.Context, docs []InsertTextDocument, userID string) error

	// Search performs a similarity search and returns top-k results
	Search(ctx context.Context, vector []float32, topK int, filter map[string]string) ([]SearchResult, error)
	SearchText(ctx context.Context, query string, topK int, userID string) ([]string, error)
	// Delete removes documents by their IDs
	Delete(ctx context.Context, ids []string, userID string) error

	// Close closes the connection to the vector store
	Close() error
}

