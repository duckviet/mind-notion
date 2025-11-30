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
	SearchNotes(ctx context.Context, query string, userID string, limit int) ([]*models.Note, int64, error)

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
	log.Printf("📄 Indexing note %s: Title='%s', Text length=%d, Content preview='%.100s...'", 
		note.ID, note.Title, len(text), text)
	if text == "" {
		log.Printf("⚠️ Skipping empty note: %s", note.ID)
		return nil
	}
 
	doc := vectorstore.InsertTextDocument{
		ID:       note.ID,
		Text:     text,
		Metadata: map[string]string{
			"user_id": note.UserID,
			"title":   note.Title,
			"status":  string(note.Status),
		},
	}
	
	log.Printf("📤 Sending to Pinecone: ID=%s, Text length=%d, Metadata=%+v", 
		doc.ID, len(doc.Text), doc.Metadata)
	
	if err := s.vectorStore.UpsertText(ctx, []vectorstore.InsertTextDocument{doc}, note.UserID); err != nil {
		log.Printf("❌ Failed to index note %s: %v", note.ID, err)
		return fmt.Errorf("failed to upsert to vector store: %w", err)
	}

	log.Printf("✅ Successfully indexed note: %s", note.ID)
	return nil
}

// SearchNotes performs semantic search on notes
func (s *searchService) SearchNotes(ctx context.Context, query string, userID string, limit int) ([]*models.Note, int64, error) {
	if query == "" {
		return nil, 0, fmt.Errorf("query cannot be empty")
	}

	if limit <= 0 {
		limit = 10
	}

	results, err := s.vectorStore.SearchText(ctx, query, limit, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to search vector store: %w", err)
	}
	total := int64(len(results))

	if total == 0 {
		return []*models.Note{}, total, nil
	}

	// Fetch full notes from database
	notes := make([]*models.Note, 0, len(results))
	for _, result := range results {
		note, err := s.noteRepo.GetByID(ctx, result)
		if err != nil {
			log.Printf("Warning: failed to fetch note %s: %v", result, err)
			continue
		}
		notes = append(notes, note)
	}

	return notes, total, nil
}

// DeleteNoteIndex removes a note from the vector store
func (s *searchService) DeleteNoteIndex(ctx context.Context, noteID string) error {
	if noteID == "" {
		return fmt.Errorf("noteID cannot be empty")
	}

	// Get note to retrieve userID for namespace
	note, err := s.noteRepo.GetByID(ctx, noteID)
	if err != nil {
		return fmt.Errorf("failed to get note for deletion: %w", err)
	}

	if err := s.vectorStore.Delete(ctx, []string{noteID}, note.UserID); err != nil {
		return fmt.Errorf("failed to delete from vector store: %w", err)
	}

	log.Printf("✅ Deleted note index: %s (namespace: user_%s)", noteID, note.UserID)
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

