package repository

import "github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"

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
	FolderID *uint
	IsPublic *bool
}

// FolderListParams represents folder-specific list parameters
type FolderListParams struct {
	Page     int
	Limit    int
	ParentID *uint
	IsPublic *bool
}
