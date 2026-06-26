package handlers

import (
	"context"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/repository"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/service"
)

type aiRunHandlerTestNoteService struct {
	note *models.Note
}

func (s aiRunHandlerTestNoteService) CreateNote(context.Context, service.CreateNoteRequest) (*models.Note, error) {
	return nil, nil
}

func (s aiRunHandlerTestNoteService) GetNoteByID(context.Context, string) (*models.Note, error) {
	return s.note, nil
}

func (s aiRunHandlerTestNoteService) UpdateNote(context.Context, string, service.UpdateNoteRequest) (*models.Note, error) {
	return nil, nil
}

func (s aiRunHandlerTestNoteService) UpdateNoteContentWithVersion(context.Context, string, string, int) (*models.Note, error) {
	return nil, nil
}

func (s aiRunHandlerTestNoteService) DeleteNote(context.Context, string) error { return nil }

func (s aiRunHandlerTestNoteService) ListNotes(context.Context, repository.NoteListParams, string) ([]*models.Note, int64, error) {
	return nil, 0, nil
}

func (s aiRunHandlerTestNoteService) GetNotesByUserID(context.Context, string, repository.NoteListParams) ([]*models.Note, int64, error) {
	return nil, 0, nil
}

func (s aiRunHandlerTestNoteService) AddTagToNote(context.Context, string, string) error { return nil }

func (s aiRunHandlerTestNoteService) RemoveTagFromNote(context.Context, string, string) error {
	return nil
}

func (s aiRunHandlerTestNoteService) UpdateNoteTOM(context.Context, string, *int32) (*models.Note, error) {
	return nil, nil
}

func (s aiRunHandlerTestNoteService) ListNotesTOM(context.Context, string) ([]*models.Note, error) {
	return nil, nil
}

func (s aiRunHandlerTestNoteService) UpdatePublicEditSettings(context.Context, string, bool) (*models.Note, error) {
	return nil, nil
}

func (s aiRunHandlerTestNoteService) RotatePublicEditToken(context.Context, string) (*models.Note, error) {
	return nil, nil
}

func (s aiRunHandlerTestNoteService) SaveNoteSnapshot(context.Context, string, string) (*models.Note, error) {
	return nil, nil
}

func (s aiRunHandlerTestNoteService) SaveNoteTiptapSnapshot(context.Context, string, string) (*models.Note, error) {
	return nil, nil
}
