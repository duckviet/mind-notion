package service

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/embeddings"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/repository"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/vectorstore"
)

// SearchService defines the interface for semantic search operations
type SearchService interface {
	// IndexNote indexes a note in the vector store
	IndexNote(ctx context.Context, note *models.Note) error

	// SearchNotes performs semantic search on notes
	SearchNotes(ctx context.Context, query string, userID string, limit int) ([]*models.Note, error)

	// DeleteNoteIndex removes a note from the vector store
	DeleteNoteIndex(ctx context.Context, noteID string) error

	// ReindexAllNotes reindexes all notes for a user
	ReindexAllNotes(ctx context.Context, userID string) error
}

// searchService implements SearchService
type searchService struct {
	embeddings  embeddings.EmbeddingProvider
	vectorStore vectorstore.VectorStore
	noteRepo    repository.NoteRepository
}

// NewSearchService creates a new search service
func NewSearchService(
	embeddingProvider embeddings.EmbeddingProvider,
	vectorStore vectorstore.VectorStore,
	noteRepo repository.NoteRepository,
) SearchService {
	return &searchService{
		embeddings:  embeddingProvider,
		vectorStore: vectorStore,
		noteRepo:    noteRepo,
	}
}

// IndexNote indexes a note in the vector store
func (s *searchService) IndexNote(ctx context.Context, note *models.Note) error {
	if note == nil {
		return fmt.Errorf("note cannot be nil")
	}

	// Prepare text for embedding (combine title and content)
	text := prepareNoteText(note)
	if text == "" {
		log.Printf("Skipping empty note: %s", note.ID)
		return nil
	}

	// Generate embedding
	embeddings, err := s.embeddings.Embed(ctx, []string{text})
	if err != nil {
		return fmt.Errorf("failed to generate embedding: %w", err)
	}

	if len(embeddings) == 0 {
		return fmt.Errorf("no embedding generated")
	}

	// Create document for vector store
	doc := vectorstore.Document{
		ID:     note.ID,
		Vector: embeddings[0],
		Metadata: map[string]string{
			"user_id": note.UserID,
			"title":   note.Title,
			"status":  string(note.Status),
		},
	}

	// Upsert to vector store
	if err := s.vectorStore.Upsert(ctx, []vectorstore.Document{doc}); err != nil {
		return fmt.Errorf("failed to upsert to vector store: %w", err)
	}

	log.Printf("✅ Indexed note: %s", note.ID)
	return nil
}

// SearchNotes performs semantic search on notes
func (s *searchService) SearchNotes(ctx context.Context, query string, userID string, limit int) ([]*models.Note, error) {
	if query == "" {
		return nil, fmt.Errorf("query cannot be empty")
	}

	if limit <= 0 {
		limit = 10
	}

	// Generate query embedding
	queryVector, err := s.embeddings.EmbedQuery(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to generate query embedding: %w", err)
	}

	// Build filter for user's notes
	filter := map[string]string{}
	if userID != "" {
		filter["user_id"] = userID
	}

	// Search vector store
	results, err := s.vectorStore.Search(ctx, queryVector, limit, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to search vector store: %w", err)
	}

	if len(results) == 0 {
		return []*models.Note{}, nil
	}

	// Fetch full notes from database
	notes := make([]*models.Note, 0, len(results))
	for _, result := range results {
		note, err := s.noteRepo.GetByID(ctx, result.ID)
		if err != nil {
			log.Printf("Warning: failed to fetch note %s: %v", result.ID, err)
			continue
		}
		notes = append(notes, note)
	}

	return notes, nil
}

// DeleteNoteIndex removes a note from the vector store
func (s *searchService) DeleteNoteIndex(ctx context.Context, noteID string) error {
	if noteID == "" {
		return fmt.Errorf("noteID cannot be empty")
	}

	if err := s.vectorStore.Delete(ctx, []string{noteID}); err != nil {
		return fmt.Errorf("failed to delete from vector store: %w", err)
	}

	log.Printf("✅ Deleted note index: %s", noteID)
	return nil
}

// ReindexAllNotes reindexes all notes for a user
func (s *searchService) ReindexAllNotes(ctx context.Context, userID string) error {
	// Fetch all notes for the user
	params := repository.NoteListParams{
		Page:  1,
		Limit: 1000, // Process in batches if needed
	}

	notes, _, err := s.noteRepo.GetByUserID(ctx, userID, params)
	if err != nil {
		return fmt.Errorf("failed to fetch notes: %w", err)
	}

	log.Printf("Reindexing %d notes for user %s", len(notes), userID)

	// Index each note
	for _, note := range notes {
		if err := s.IndexNote(ctx, note); err != nil {
			log.Printf("Warning: failed to index note %s: %v", note.ID, err)
			continue
		}
	}

	return nil
}

// prepareNoteText prepares the text content for embedding
func prepareNoteText(note *models.Note) string {
	parts := []string{}

	if note.Title != "" {
		parts = append(parts, note.Title)
	}

	if note.Content != "" {
		// Clean HTML content if needed
		content := cleanContent(note.Content)
		if content != "" {
			parts = append(parts, content)
		}
	}

	return strings.Join(parts, "\n\n")
}

// cleanContent removes HTML tags and cleans up content
func cleanContent(content string) string {
	// Basic HTML tag removal (for simple cases)
	// For production, consider using a proper HTML parser
	result := content

	// Remove common HTML tags
	replacements := []string{
		"<br>", "\n",
		"<br/>", "\n",
		"<br />", "\n",
		"<p>", "",
		"</p>", "\n",
		"<div>", "",
		"</div>", "\n",
		"&nbsp;", " ",
		"&amp;", "&",
		"&lt;", "<",
		"&gt;", ">",
	}

	for i := 0; i < len(replacements); i += 2 {
		result = strings.ReplaceAll(result, replacements[i], replacements[i+1])
	}

	// Trim and normalize whitespace
	result = strings.TrimSpace(result)

	return result
}

