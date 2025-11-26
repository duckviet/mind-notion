package vectorstore

import (
	"context"
	"fmt"
	"log"

	"github.com/pinecone-io/go-pinecone/v4/pinecone"
	"google.golang.org/protobuf/types/known/structpb"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/config"
)

// pineconeStore implements VectorStore using Pinecone
type pineconeStore struct {
	client    *pinecone.Client
	indexConn *pinecone.IndexConnection
	namespace string
}

// NewPineconeStore creates a new Pinecone vector store
func NewPineconeStore(ctx context.Context, cfg config.PineconeConfig) (VectorStore, error) {
	if cfg.APIKey == "" {
		return nil, fmt.Errorf("pinecone API key is required")
	}

	// Create Pinecone client
	client, err := pinecone.NewClient(pinecone.NewClientParams{
		ApiKey: cfg.APIKey,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create pinecone client: %w", err)
	}

	// Get index
	idx, err := client.DescribeIndex(ctx, cfg.IndexName)
	if err != nil {
		return nil, fmt.Errorf("failed to describe index '%s': %w", cfg.IndexName, err)
	}

	// Connect to index
	indexConn, err := client.Index(pinecone.NewIndexConnParams{
		Host:      idx.Host,
		Namespace: cfg.Namespace,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to index: %w", err)
	}

	log.Printf("✅ Connected to Pinecone index: %s (namespace: %s)", cfg.IndexName, cfg.Namespace)

	return &pineconeStore{
		client:    client,
		indexConn: indexConn,
		namespace: cfg.Namespace,
	}, nil
}

// Upsert inserts or updates documents in Pinecone
func (p *pineconeStore) Upsert(ctx context.Context, docs []Document) error {
	if len(docs) == 0 {
		return nil
	}

	vectors := make([]*pinecone.Vector, len(docs))
	for i, doc := range docs {
		metadata, err := structpb.NewStruct(convertToInterfaceMap(doc.Metadata))
		if err != nil {
			return fmt.Errorf("failed to create metadata for doc %s: %w", doc.ID, err)
		}

		vectors[i] = &pinecone.Vector{
			Id:       doc.ID,
			Values:   &doc.Vector,
			Metadata: metadata,
		}
	}

	_, err := p.indexConn.UpsertVectors(ctx, vectors)
	if err != nil {
		return fmt.Errorf("failed to upsert vectors: %w", err)
	}

	return nil
}

// Search performs a similarity search in Pinecone
func (p *pineconeStore) Search(ctx context.Context, vector []float32, topK int, filter map[string]string) ([]SearchResult, error) {
	req := &pinecone.QueryByVectorValuesRequest{
		Vector:          vector,
		TopK:            uint32(topK),
		IncludeMetadata: true,
	}

	// Add filter if provided
	if len(filter) > 0 {
		metadataFilter, err := buildMetadataFilter(filter)
		if err != nil {
			return nil, fmt.Errorf("failed to build metadata filter: %w", err)
		}
		req.MetadataFilter = metadataFilter
	}

	resp, err := p.indexConn.QueryByVectorValues(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("failed to query vectors: %w", err)
	}

	results := make([]SearchResult, len(resp.Matches))
	for i, match := range resp.Matches {
		results[i] = SearchResult{
			ID:       match.Vector.Id,
			Score:    match.Score,
			Metadata: extractMetadata(match.Vector.Metadata),
		}
	}

	return results, nil
}

// Delete removes documents from Pinecone by IDs
func (p *pineconeStore) Delete(ctx context.Context, ids []string) error {
	if len(ids) == 0 {
		return nil
	}

	err := p.indexConn.DeleteVectorsById(ctx, ids)
	if err != nil {
		return fmt.Errorf("failed to delete vectors: %w", err)
	}

	return nil
}

// Close closes the Pinecone connection
func (p *pineconeStore) Close() error {
	// Pinecone Go client doesn't require explicit connection closing
	return nil
}

// convertToInterfaceMap converts string map to interface map for structpb
func convertToInterfaceMap(m map[string]string) map[string]interface{} {
	result := make(map[string]interface{})
	for k, v := range m {
		result[k] = v
	}
	return result
}

// buildMetadataFilter creates a metadata filter for queries
func buildMetadataFilter(filter map[string]string) (*structpb.Struct, error) {
	filterMap := make(map[string]interface{})
	for k, v := range filter {
		filterMap[k] = map[string]interface{}{
			"$eq": v,
		}
	}
	return structpb.NewStruct(filterMap)
}

// extractMetadata converts *structpb.Struct to string map
func extractMetadata(m *structpb.Struct) map[string]string {
	if m == nil {
		return nil
	}

	result := make(map[string]string)
	for k, v := range m.GetFields() {
		switch val := v.GetKind().(type) {
		case *structpb.Value_StringValue:
			result[k] = val.StringValue
		case *structpb.Value_NumberValue:
			result[k] = fmt.Sprintf("%v", val.NumberValue)
		case *structpb.Value_BoolValue:
			result[k] = fmt.Sprintf("%v", val.BoolValue)
		default:
			result[k] = fmt.Sprintf("%v", v.AsInterface())
		}
	}

	return result
}
