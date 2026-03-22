package models

import (
	"github.com/pgvector/pgvector-go"
)

// NoteChunk stores a single chunk of a note along with its embedding vector.
type NoteChunk struct {
	BaseModel

	NoteID         string          `gorm:"type:uuid;not null;index" json:"note_id"`
	UserID         string          `gorm:"type:uuid;not null;index" json:"user_id"`
	ChunkIndex     int             `gorm:"not null" json:"chunk_index"`
	Text           string          `gorm:"type:text" json:"text"`
	TextEmbeddings pgvector.Vector `gorm:"column:text_embeddings;type:vector(1024)" json:"-"`
}

func (NoteChunk) TableName() string {
	return "note_chunks"
}
