package embeddings

import "context"

// EmbeddingProvider defines the interface for generating text embeddings
type EmbeddingProvider interface {
	// Embed generates embeddings for multiple texts (for indexing documents)
	Embed(ctx context.Context, texts []string) ([][]float32, error)

	// EmbedQuery generates embedding for a single query text (for searching)
	EmbedQuery(ctx context.Context, query string) ([]float32, error)

	// GetDimension returns the dimension of the embedding vectors
	GetDimension() int
}

