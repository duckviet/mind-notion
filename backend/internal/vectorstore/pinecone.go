package vectorstore

import (
	"context"
	"fmt"
	"log"
	"sync"

	"github.com/pinecone-io/go-pinecone/v4/pinecone"
	"google.golang.org/protobuf/types/known/structpb"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/config"
)

// pineconeStore implements VectorStore using Pinecone
type pineconeStore struct {
	client      *pinecone.Client
	indexHost   string
	indexName   string
	defaultNS   string
	namespace   string
	connCache   map[string]*pinecone.IndexConnection
	connCacheMu sync.RWMutex
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
	log.Printf("✅ Index description: %+v", idx)

	// Connect to index
	_, err = client.Index(pinecone.NewIndexConnParams{
		Host:      idx.Host,
		Namespace: cfg.Namespace,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to index: %w", err)
	}

	log.Printf("✅ Connected to Pinecone index: %s (default namespace: %s)", cfg.IndexName, cfg.Namespace)

	return &pineconeStore{
		client:    client,
		indexHost: idx.Host,
		indexName: cfg.IndexName,
		defaultNS: cfg.Namespace,
		namespace: cfg.Namespace,
		connCache: make(map[string]*pinecone.IndexConnection),
	}, nil
}

// getUserNamespace creates a namespace string from userID
func getUserNamespace(userID string) string {
	// Sanitize userID to be namespace-safe (no special chars)
	// Pinecone namespace can contain alphanumeric, hyphens, underscores
	return fmt.Sprintf("user_%s", userID)
}

// getIndexConnection gets or creates an index connection for a specific namespace
func (p *pineconeStore) getIndexConnection(namespace string) (*pinecone.IndexConnection, error) {
	// Check cache first
	p.connCacheMu.RLock()
	if conn, exists := p.connCache[namespace]; exists {
		p.connCacheMu.RUnlock()
		return conn, nil
	}
	p.connCacheMu.RUnlock()

	// Create new connection
	p.connCacheMu.Lock()
	defer p.connCacheMu.Unlock()

	// Double-check after acquiring write lock
	if conn, exists := p.connCache[namespace]; exists {
		return conn, nil
	}

	conn, err := p.client.Index(pinecone.NewIndexConnParams{
		Host:      p.indexHost,
		Namespace: namespace,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to namespace '%s': %w", namespace, err)
	}

	p.connCache[namespace] = conn
	log.Printf("✅ Connected to namespace: %s", namespace)
	return conn, nil
}

// Upsert inserts or updates documents in Pinecone (uses default namespace)
// Note: For user-specific upsert, use UpsertText with userID
func (p *pineconeStore) Upsert(ctx context.Context, docs []InsertVectorDocument) error {
	if len(docs) == 0 {
		return nil
	}

	// Use default namespace for vector-based upsert
	indexConn, err := p.getIndexConnection(p.defaultNS)
	if err != nil {
		return err
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

	_, err = indexConn.UpsertVectors(ctx, vectors)
	if err != nil {
		return fmt.Errorf("failed to upsert vectors: %w", err)
	}

	return nil
}

func (p *pineconeStore) UpsertText(ctx context.Context, docs []InsertTextDocument, userID string) error {
	if len(docs) == 0 {
		return nil
	}

	if userID == "" {
		return fmt.Errorf("userID is required for namespace-based upsert")
	}

	// Get namespace for user
	namespace := getUserNamespace(userID)
	indexConn, err := p.getIndexConnection(namespace)
	if err != nil {
		return err
	}

	records := make([]*pinecone.IntegratedRecord, len(docs))
	for i, doc := range docs {
		record := pinecone.IntegratedRecord{
			"id":   doc.ID,
			"text": doc.Text,
		}

		// Add metadata fields directly to the record
		for k, v := range doc.Metadata {
			record[k] = v
		}

		// Log each record details
		log.Printf("📝 Preparing record %d: ID=%s, Text length=%d, Metadata=%+v",
			i+1, doc.ID, len(doc.Text), doc.Metadata)

		records[i] = &record
	}

	log.Printf("🚀 Upserting %d records to Pinecone (namespace: %s, userID: %s)",
		len(records), namespace, userID)

	err = indexConn.UpsertRecords(ctx, records)

	if err != nil {
		log.Printf("❌ Pinecone upsert error: %+v", err)
		log.Printf("❌ Error details: %v", err)
		if err.Error() != "" {
			log.Printf("❌ Error message: %s", err.Error())
		}
		return fmt.Errorf("failed to upsert texts to Pinecone: %w", err)
	}

	log.Printf("✅ Successfully upserted %d records to Pinecone (namespace: %s)", len(records), namespace)
	return nil
}
// Search performs a similarity search in Pinecone (uses default namespace)
// Note: For user-specific search, use SearchText with userID
func (p *pineconeStore) Search(ctx context.Context, vector []float32, topK int, filter map[string]string) ([]SearchResult, error) {
	// Use default namespace for vector-based search
	indexConn, err := p.getIndexConnection(p.defaultNS)
	if err != nil {
		return nil, err
	}

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

	resp, err := indexConn.QueryByVectorValues(ctx, req)
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

func (p *pineconeStore) SearchText(ctx context.Context, query string, topK int, userID string) ([]string, error) {
	if userID == "" {
		return nil, fmt.Errorf("userID is required for namespace-based search")
	}

	// Get namespace for user
	namespace := getUserNamespace(userID)
	indexConn, err := p.getIndexConnection(namespace)
	if err != nil {
		return nil, err
	}

	log.Printf("🔍 Searching in namespace: %s (userID: %s), query: %s", namespace, userID, query)

	res, err := indexConn.SearchRecords(ctx, &pinecone.SearchRecordsRequest{
		Query: pinecone.SearchRecordsQuery{
			TopK: int32(topK),
			Inputs: &map[string]interface{}{
				"text": query,
			},
		},
	})

	if err != nil {
		log.Printf("❌ Search error: %v", err)
		return nil, fmt.Errorf("failed to query text: %w", err)
	}

	log.Printf("🔍 Search results: found %d matches", len(res.Result.Hits))

	log.Printf("🔍 Search results: %v", res.Result.Hits)
	// Convert results to SearchResult format
	recordIds := make([]string, 0, len(res.Result.Hits))
	for _, record := range res.Result.Hits {
		recordIds = append(recordIds, record.Id)
	}
	fmt.Printf("🔍 Record IDs: %v", recordIds)
	// results := make([]SearchResult, 0, len(res.Result.Hits))
	// for _, record := range res.Result.Hits {
	// 	// Extract ID from record
	// 	var recordID string
	// 	if idVal, ok := record.Fields["id"]; ok {
	// 		if idStr, ok := idVal.(string); ok {
	// 			recordID = idStr
	// 		}
	// 	}

	// 	// Extract metadata
	// 	metadata := make(map[string]string)
	// 	for k, v := range record.Fields {
	// 		if k != "id" && k != "text" && k != "score" {
	// 			if strVal, ok := v.(string); ok {
	// 				metadata[k] = strVal
	// 			} else {
	// 				metadata[k] = fmt.Sprintf("%v", v)
	// 			}
	// 		}
	// 	}

	// 	// Extract score if available
	// 	var score float32
	// 	if scoreVal, ok := record.Fields["score"]; ok {
	// 		if scoreFloat, ok := scoreVal.(float64); ok {
	// 			score = float32(scoreFloat)
	// 		} else if scoreFloat, ok := scoreVal.(float32); ok {
	// 			score = scoreFloat
	// 		}
	// 	}

	// 	results = append(results, SearchResult{
	// 		ID:       recordID,
	// 		Score:    score,
	// 		Metadata: metadata,
	// 	})
	// }

	return recordIds, nil
}
// Delete removes documents from Pinecone by IDs
func (p *pineconeStore) Delete(ctx context.Context, ids []string, userID string) error {
	if len(ids) == 0 {
		return nil
	}

	if userID == "" {
		return fmt.Errorf("userID is required for namespace-based delete")
	}

	// Get namespace for user
	namespace := getUserNamespace(userID)
	indexConn, err := p.getIndexConnection(namespace)
	if err != nil {
		return err
	}

	log.Printf("🗑️ Deleting %d records from namespace: %s (userID: %s)", len(ids), namespace, userID)

	err = indexConn.DeleteVectorsById(ctx, ids)
	if err != nil {
		return fmt.Errorf("failed to delete vectors: %w", err)
	}

	log.Printf("✅ Successfully deleted %d records from namespace: %s", len(ids), namespace)
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
