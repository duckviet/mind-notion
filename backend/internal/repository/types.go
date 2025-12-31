package repository

import (
	"errors"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
)

// Common repository errors
var (
	ErrNotFound = errors.New("record not found")
)

// ListParams represents common pagination parameters
type ListParams struct {
	Page   int
	Limit  int
	Status *models.UserStatus
	Email  *string
}

// NoteListParams represents note-specific list parameters
type NoteListParams struct {
	Page     int
	Limit    int
	Status   *models.NoteStatus
	FolderID *string
	IsPublic *bool
	Query    *string
}

// FolderListParams represents folder-specific list parameters
type FolderListParams struct {
	Page     int
	Limit    int
	ParentID *string
	IsPublic *bool
}
