package repository

import (
	"context"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/database"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
	"github.com/pgvector/pgvector-go"
	"gorm.io/gorm"
)

// NoteChunkInput represents a chunk to be stored along with its embedding.
type NoteChunkInput struct {
	ChunkIndex     int
	Text           string
	TextEmbeddings []float64
}

type NoteChunkSearchResult struct {
	NoteID     string
	ChunkIndex int
	Text       string
	Score      float64
}

// NoteChunkRepository defines operations for persisting note chunks.
type NoteChunkRepository interface {
	// ReplaceNoteChunks removes all existing chunks for a note and inserts the new list.
	ReplaceNoteChunks(ctx context.Context, noteID, userID string, chunks []NoteChunkInput) error
	SearchSimilarByUser(ctx context.Context, userID string, queryEmbedding []float64, topK int, minScore float64) ([]NoteChunkSearchResult, error)
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
			vector := toFloat32Slice(ch.TextEmbeddings)
			if len(vector) == 0 {
				continue
			}
			items = append(items, models.NoteChunk{
				NoteID:         noteID,
				UserID:         userID,
				ChunkIndex:     ch.ChunkIndex,
				Text:           ch.Text,
				TextEmbeddings: pgvector.NewVector(vector),
			})
		}

		if len(items) == 0 {
			return nil
		}

		if err := tx.Create(&items).Error; err != nil {
			return err
		}

		return nil
	})
}

func (r *noteChunkRepository) SearchSimilarByUser(ctx context.Context, userID string, queryEmbedding []float64, topK int, minScore float64) ([]NoteChunkSearchResult, error) {
	if topK <= 0 {
		topK = 5
	}
	if minScore < 0 {
		minScore = 0
	}
	if minScore > 1 {
		minScore = 1
	}

	queryVector := toFloat32Slice(queryEmbedding)
	if len(queryVector) == 0 {
		return []NoteChunkSearchResult{}, nil
	}

	maxDistance := 1.0 - minScore

	type searchRow struct {
		NoteID     string  `gorm:"column:note_id"`
		ChunkIndex int     `gorm:"column:chunk_index"`
		Text       string  `gorm:"column:text"`
		Distance   float64 `gorm:"column:distance"`
	}

	rows := make([]searchRow, 0, topK)
	vectorParam := pgvector.NewVector(queryVector)
	if err := r.db.WithContext(ctx).Raw(
		`SELECT note_id, chunk_index, text, (text_embeddings <=> ?::vector) AS distance
		 FROM note_chunks
		 WHERE user_id = ?
		   AND text_embeddings IS NOT NULL
		   AND (text_embeddings <=> ?::vector) <= ?
		 ORDER BY text_embeddings <=> ?::vector
		 LIMIT ?`,
		vectorParam,
		userID,
		vectorParam,
		maxDistance,
		vectorParam,
		topK,
	).Scan(&rows).Error; err != nil {
		return nil, err
	}

	results := make([]NoteChunkSearchResult, 0, len(rows))
	for _, row := range rows {
		score := 1.0 - row.Distance
		if score < minScore {
			continue
		}
		results = append(results, NoteChunkSearchResult{
			NoteID:     row.NoteID,
			ChunkIndex: row.ChunkIndex,
			Text:       row.Text,
			Score:      score,
		})
	}

	return results, nil
}

func toFloat32Slice(values []float64) []float32 {
	result := make([]float32, 0, len(values))
	for _, value := range values {
		result = append(result, float32(value))
	}
	return result
}
