package embeddings

import (
	"context"
	"fmt"

	cohere "github.com/cohere-ai/cohere-go/v2"
	cohereclient "github.com/cohere-ai/cohere-go/v2/client"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/config"
)

const (
	// CohereEmbedDimension is the dimension for Cohere embed-v3 models
	CohereEmbedDimension = 1024
)

// cohereProvider implements EmbeddingProvider using Cohere API
type cohereProvider struct {
	client *cohereclient.Client
	model  string
}

// NewCohereProvider creates a new Cohere embedding provider
func NewCohereProvider(cfg config.CohereConfig) (EmbeddingProvider, error) {
	if cfg.APIKey == "" {
		return nil, fmt.Errorf("cohere API key is required")
	}

	client := cohereclient.NewClient(cohereclient.WithToken(cfg.APIKey))

	model := cfg.Model
	if model == "" {
		model = "embed-multilingual-v3.0"
	}

	return &cohereProvider{
		client: client,
		model:  model,
	}, nil
}

// Embed generates embeddings for multiple texts (for indexing documents)
func (p *cohereProvider) Embed(ctx context.Context, texts []string) ([][]float32, error) {
	if len(texts) == 0 {
		return nil, nil
	}

	resp, err := p.client.Embed(ctx, &cohere.EmbedRequest{
		Texts:     texts,
		Model:     &p.model,
		InputType: cohere.EmbedInputTypeSearchDocument.Ptr(),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to generate embeddings: %w", err)
	}

	// Extract embeddings from response
	if resp.EmbeddingsFloats == nil {
		return nil, fmt.Errorf("no embeddings returned from Cohere")
	}

	embeddings := resp.EmbeddingsFloats.Embeddings
	result := make([][]float32, len(embeddings))
	for i, emb := range embeddings {
		result[i] = float64sToFloat32s(emb)
	}

	return result, nil
}

// EmbedQuery generates embedding for a single query text (for searching)
func (p *cohereProvider) EmbedQuery(ctx context.Context, query string) ([]float32, error) {
	if query == "" {
		return nil, fmt.Errorf("query cannot be empty")
	}

	resp, err := p.client.Embed(ctx, &cohere.EmbedRequest{
		Texts:     []string{query},
		Model:     &p.model,
		InputType: cohere.EmbedInputTypeSearchQuery.Ptr(),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to generate query embedding: %w", err)
	}

	if resp.EmbeddingsFloats == nil || len(resp.EmbeddingsFloats.Embeddings) == 0 {
		return nil, fmt.Errorf("no embedding returned from Cohere")
	}

	return float64sToFloat32s(resp.EmbeddingsFloats.Embeddings[0]), nil
}

// GetDimension returns the dimension of the embedding vectors
func (p *cohereProvider) GetDimension() int {
	return CohereEmbedDimension
}

// float64sToFloat32s converts a slice of float64 to float32
func float64sToFloat32s(f64s []float64) []float32 {
	f32s := make([]float32, len(f64s))
	for i, v := range f64s {
		f32s[i] = float32(v)
	}
	return f32s
}

