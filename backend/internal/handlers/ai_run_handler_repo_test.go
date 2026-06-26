package handlers

import (
	"context"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/config"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/repository"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

type aiRunHandlerTestRepo struct {
	mu        sync.Mutex
	runs      map[string]*models.AIRun
	toolCalls map[string]*models.AIToolCall
	events    map[string][]models.AIRunEvent
}

func newAIRunHandlerTestRepo() *aiRunHandlerTestRepo {
	return &aiRunHandlerTestRepo{
		runs:      make(map[string]*models.AIRun),
		toolCalls: make(map[string]*models.AIToolCall),
		events:    make(map[string][]models.AIRunEvent),
	}
}

func (r *aiRunHandlerTestRepo) CreateRun(_ context.Context, run *models.AIRun) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	runCopy := *run
	r.runs[run.ID] = &runCopy
	return nil
}

func (r *aiRunHandlerTestRepo) GetRun(_ context.Context, runID string) (*models.AIRun, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	run, ok := r.runs[runID]
	if !ok {
		return nil, gorm.ErrRecordNotFound
	}
	runCopy := *run
	return &runCopy, nil
}

func (r *aiRunHandlerTestRepo) UpdateRunStatus(_ context.Context, runID string, status models.AIRunStatus) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	storedRun, ok := r.runs[runID]
	if !ok {
		return gorm.ErrRecordNotFound
	}
	storedRun.Status = status
	return nil
}

func (r *aiRunHandlerTestRepo) SetRunResume(_ context.Context, runID, resumeToken, lastEventID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	run, ok := r.runs[runID]
	if !ok {
		return gorm.ErrRecordNotFound
	}
	run.ResumeToken = resumeToken
	run.LastEventID = lastEventID
	return nil
}

func (r *aiRunHandlerTestRepo) AppendEvent(_ context.Context, event *models.AIRunEvent) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	eventCopy := *event
	r.events[event.RunID] = append(r.events[event.RunID], eventCopy)
	return nil
}

func (r *aiRunHandlerTestRepo) ListEvents(_ context.Context, runID string, afterSeq int64, limit int) ([]models.AIRunEvent, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	events := r.events[runID]
	result := make([]models.AIRunEvent, 0, len(events))
	for _, event := range events {
		result = append(result, event)
	}
	if limit > 0 && len(result) > limit {
		result = result[:limit]
	}
	return result, nil
}

func (r *aiRunHandlerTestRepo) ListEventsAfter(_ context.Context, runID, lastEventID string, limit int) ([]models.AIRunEvent, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	events := r.events[runID]
	result := make([]models.AIRunEvent, 0, len(events))
	include := lastEventID == ""
	for _, event := range events {
		if include {
			result = append(result, event)
		}
		if event.EventID == lastEventID {
			include = true
		}
	}
	if limit > 0 && len(result) > limit {
		result = result[:limit]
	}
	return result, nil
}

func (r *aiRunHandlerTestRepo) CreateToolCall(_ context.Context, toolCall *models.AIToolCall) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	toolCallCopy := *toolCall
	r.toolCalls[toolCall.ID] = &toolCallCopy
	return nil
}

func (r *aiRunHandlerTestRepo) UpsertPendingToolCall(_ context.Context, toolCall *models.AIToolCall) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for id, storedToolCall := range r.toolCalls {
		if storedToolCall.RunID == toolCall.RunID && storedToolCall.ToolCallID == toolCall.ToolCallID {
			toolCallCopy := *toolCall
			toolCallCopy.ID = id
			toolCallCopy.Status = models.AIToolCallStatusPending
			r.toolCalls[id] = &toolCallCopy
			return nil
		}
	}
	toolCallCopy := *toolCall
	toolCallCopy.Status = models.AIToolCallStatusPending
	r.toolCalls[toolCall.ID] = &toolCallCopy
	return nil
}

func (r *aiRunHandlerTestRepo) ApproveToolCall(_ context.Context, runID, toolCallID, userID string, approved bool) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	storedToolCall, ok := r.toolCalls[toolCallID]
	if !ok || storedToolCall.RunID != runID {
		return gorm.ErrRecordNotFound
	}
	if storedToolCall.Status != models.AIToolCallStatusPending {
		return repository.ErrAIToolCallNotPending
	}
	if approved {
		storedToolCall.Status = models.AIToolCallStatusApproved
	} else {
		storedToolCall.Status = models.AIToolCallStatusRejected
	}
	storedToolCall.ApprovedBy = userID
	now := time.Now()
	storedToolCall.ApprovedAt = &now
	return nil
}

func (r *aiRunHandlerTestRepo) GetToolCall(_ context.Context, runID string, toolCallID string) (*models.AIToolCall, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	toolCall, ok := r.toolCalls[toolCallID]
	if !ok || toolCall.RunID != runID {
		return nil, gorm.ErrRecordNotFound
	}
	toolCallCopy := *toolCall
	return &toolCallCopy, nil
}

func (r *aiRunHandlerTestRepo) ExpirePendingToolCalls(_ context.Context, before time.Time) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for _, toolCall := range r.toolCalls {
		if toolCall.Status == models.AIToolCallStatusPending && toolCall.CreatedAt.Before(before) {
			toolCall.Status = models.AIToolCallStatusExpired
		}
	}
	return nil
}

func (r *aiRunHandlerTestRepo) mustCreateRun(t *testing.T, run *models.AIRun) {
	t.Helper()
	require.NoError(t, r.CreateRun(context.Background(), run))
}

func (r *aiRunHandlerTestRepo) mustCreateToolCall(t *testing.T, toolCall *models.AIToolCall) {
	t.Helper()
	require.NoError(t, r.CreateToolCall(context.Background(), toolCall))
}

func (r *aiRunHandlerTestRepo) mustGetToolCall(t *testing.T, id string) models.AIToolCall {
	t.Helper()
	r.mu.Lock()
	defer r.mu.Unlock()
	toolCall, ok := r.toolCalls[id]
	require.True(t, ok)
	return *toolCall
}

func newAIRunHandlerTestRouter(t *testing.T, python http.HandlerFunc, note *models.Note) (*gin.Engine, *aiRunHandlerTestRepo) {
	t.Helper()

	gin.SetMode(gin.TestMode)
	pythonServer := httptest.NewServer(python)
	t.Cleanup(pythonServer.Close)

	repo := newAIRunHandlerTestRepo()

	api := NewAIRunAPI(
		&config.Config{
			AI: config.AIConfig{
				ServiceURL:   pythonServer.URL,
				ServiceToken: "test-service-token",
			},
		},
		aiRunHandlerTestNoteService{note: note},
		repo,
	)

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("user", &models.User{BaseModel: models.BaseModel{ID: "user-1"}})
		c.Next()
	})
	group := router.Group("/api/v1/ai")
	group.POST("/inline-edit/runs", api.InlineEditRun)
	group.POST("/runs/:run_id/consent", api.ProvideConsent)

	return router, repo
}
