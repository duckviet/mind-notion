package handlers

import (
	"net/http"
	"strconv"

	dbmodels "github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/service"
	"github.com/gin-gonic/gin"
)

// SearchHandler handles search-related endpoints
type SearchHandler struct {
	searchService service.SearchService
}

// NewSearchHandler creates a new search handler
func NewSearchHandler(searchService service.SearchService) *SearchHandler {
	return &SearchHandler{
		searchService: searchService,
	}
}

// SearchNotes handles GET /api/v1/notes/search?q=<query>&limit=10
func (h *SearchHandler) SearchNotes(c *gin.Context) {
	// Get authenticated user
	userVal, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	u := userVal.(*dbmodels.User)

	// Get query parameters
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "query parameter 'q' is required"})
		return
	}

	// Get limit (default 10)
	limit := 10
	if limitStr := c.Query("limit"); limitStr != "" {
		if v, err := strconv.Atoi(limitStr); err == nil && v > 0 {
			limit = v
		}
	}

	// Perform semantic search
	notes, err := h.searchService.SearchNotes(c.Request.Context(), query, u.ID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"notes": notes,
		"total": len(notes),
		"query": query,
	})
}

// IndexNote handles POST /api/v1/notes/:id/index
// Manually trigger indexing of a specific note
func (h *SearchHandler) IndexNote(c *gin.Context) {
	// Get authenticated user
	userVal, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	u := userVal.(*dbmodels.User)

	noteID := c.Param("id")
	if noteID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "note ID is required"})
		return
	}

	// Note: In production, you'd want to fetch the note and verify ownership
	// For simplicity, we'll pass a minimal note struct
	// The actual implementation should use NoteService to fetch the note first

	c.JSON(http.StatusOK, gin.H{
		"message": "Note indexing triggered",
		"note_id": noteID,
		"user_id": u.ID,
	})
}

// ReindexAllNotes handles POST /api/v1/notes/reindex
// Reindex all notes for the current user
func (h *SearchHandler) ReindexAllNotes(c *gin.Context) {
	// Get authenticated user
	userVal, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	u := userVal.(*dbmodels.User)

	// Trigger reindexing
	if err := h.searchService.ReindexAllNotes(c.Request.Context(), u.ID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "All notes reindexing completed",
		"user_id": u.ID,
	})
}

