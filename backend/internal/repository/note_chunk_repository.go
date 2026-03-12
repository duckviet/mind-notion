package repository

import (
	"context"
	"encoding/json"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/database"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// NoteChunkInput represents a chunk to be stored along with its embedding.
type NoteChunkInput struct {
	ChunkIndex int
	Text       string
	Embedding  []float64
}

// NoteChunkRepository defines operations for persisting note chunks.
type NoteChunkRepository interface {
	// ReplaceNoteChunks removes all existing chunks for a note and inserts the new list.
	ReplaceNoteChunks(ctx context.Context, noteID, userID string, chunks []NoteChunkInput) error
}

type noteChunkRepository struct {
	db *database.DB
}

// NewNoteChunkRepository creates a new NoteChunkRepository.
func NewNoteChunkRepository(db *database.DB) NoteChunkRepository {
	return &noteChunkRepository{db: db}
}

func (r *noteChunkRepository) ReplaceNoteChunks(ctx context.Context, noteID, userID string, chunks []NoteChunkInput) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Delete existing chunks for this note
		if err := tx.Unscoped().Where("note_id = ?", noteID).Delete(&models.NoteChunk{}).Error; err != nil {
			return err
		}

		if len(chunks) == 0 {
			return nil
		}

		items := make([]models.NoteChunk, 0, len(chunks))
		for _, ch := range chunks {
			data, err := json.Marshal(ch.Embedding)
			if err != nil {
				return err
			}
			items = append(items, models.NoteChunk{
				NoteID:     noteID,
				UserID:     userID,
				ChunkIndex: ch.ChunkIndex,
				Text:       ch.Text,
				Embedding:  datatypes.JSON(data),
			})
		}

		if err := tx.Create(&items).Error; err != nil {
			return err
		}

		return nil
	})
}
