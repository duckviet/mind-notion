package handlers

import (
	"bufio"
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/config"
	dbmodels "github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/handlers/interfaces"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/repository"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type AIRunAPI struct {
	config           *config.Config
	noteService      service.NoteService
	aiRuns           repository.AIRunRepository
	httpClient       *http.Client
	streamHTTPClient *http.Client
}

var _ interfaces.AIRunAPIHandler = (*AIRunAPI)(nil)

func NewAIRunAPI(cfg *config.Config, noteService service.NoteService, aiRuns repository.AIRunRepository) *AIRunAPI {
	timeout := time.Duration(cfg.AI.RequestTimeoutMs) * time.Millisecond
	return &AIRunAPI{
		config:           cfg,
		noteService:      noteService,
		aiRuns:           aiRuns,
		httpClient:       &http.Client{Timeout: timeout},
		streamHTTPClient: &http.Client{},
	}
}

func (api *AIRunAPI) persistRun(
	c *gin.Context,
	user *dbmodels.User,
	runID string,
	workspaceID string,
	noteID string,
	sessionID string,
) error {
	if api.aiRuns == nil {
		return nil
	}
	return api.aiRuns.CreateRun(c.Request.Context(), &dbmodels.AIRun{
		RunID:       runID,
		UserID:      user.ID,
		WorkspaceID: workspaceID,
		NoteID:      noteID,
		SessionID:   sessionID,
		Status:      dbmodels.AIRunStatusRunning,
	})
}

type createRunRequest struct {
	WorkspaceID string `json:"workspace_id" binding:"required"`
	SessionID   string `json:"session_id" binding:"required"`
	NoteID      string `json:"note_id"`
	Message     struct {
		Role    string `json:"role"`
		Content string `json:"content" binding:"required"`
	} `json:"message" binding:"required"`
}

type consentRequest struct {
	ToolCallID string `json:"tool_call_id" binding:"required"`
	Approved   bool   `json:"approved"`
}

type inlineEditRequest struct {
	WorkspaceID     string                   `json:"workspace_id" binding:"required"`
	ExpectedVersion int                      `json:"expected_version"`
	NoteID          string                   `json:"note_id"`
	Action          string                   `json:"action" binding:"required"`
	Command         string                   `json:"command"`
	Mode            string                   `json:"mode"`
	SelectedText    string                   `json:"selected_text" binding:"required"`
	CustomPrompt    string                   `json:"custom_prompt"`
	ContextBlocks   []map[string]interface{} `json:"context_blocks"`
}

func (api *AIRunAPI) CreateRun(c *gin.Context) {
	var req createRunRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request, " + err.Error()})
		return
	}

	userVal, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	user := userVal.(*dbmodels.User)

	trimmedNoteID := strings.TrimSpace(req.NoteID)

	noteVersion := 0
	resourceNoteID := ""
	allowedTools := []map[string]interface{}{
		{
			"name": "rag.search",
			"constraints": map[string]interface{}{
				"workspace_id":         req.WorkspaceID,
				"require_user_consent": false,
			},
		},
		{
			"name": "web.search",
			"constraints": map[string]interface{}{
				"workspace_id":         req.WorkspaceID,
				"require_user_consent": false,
			},
		},
		{
			"name": "notes.read",
			"constraints": map[string]interface{}{
				"workspace_id":         req.WorkspaceID,
				"require_user_consent": false,
			},
		},
		{
			"name": "notes.write",
			"constraints": map[string]interface{}{
				"workspace_id":         req.WorkspaceID,
				"require_user_consent": true,
			},
		},
	}

	if trimmedNoteID != "" {
		note, err := api.noteService.GetNoteByID(c.Request.Context(), trimmedNoteID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "note not found"})
			return
		}
		if note.UserID != user.ID {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}

		resourceNoteID = trimmedNoteID
		noteVersion = note.Version

	}

	runID := uuid.NewString()
	if err := api.persistRun(c, user, runID, req.WorkspaceID, req.NoteID, req.SessionID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to persist ai run"})
		return
	}
	payload := map[string]interface{}{
		"run_id":   runID,
		"trace_id": c.GetString("trace_id"),
		"actor": map[string]string{
			"user_id":      user.ID,
			"tenant_id":    "",
			"workspace_id": req.WorkspaceID,
		},
		"conversation": []map[string]string{
			{
				"role":    "user",
				"content": req.Message.Content,
			},
		},
		"resource_context": map[string]interface{}{
			"note_id":      resourceNoteID,
			"note_version": noteVersion,
		},
		"allowed_tools": allowedTools,
		"policy": map[string]interface{}{
			"max_tool_calls": 5,
			"timeout_ms":     30000,
			"redact_pii":     true,
			"max_tokens":     4096,
		},
		"quota": map[string]interface{}{
			"tokens_remaining": 0,
			"calls_today":      0,
			"tier":             "free",
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to prepare request"})
		return
	}

	aiURL := strings.TrimRight(api.config.AI.ServiceURL, "/") + "/internal/v1/agent/runs"
	httpReq, err := http.NewRequestWithContext(c.Request.Context(), http.MethodPost, aiURL, bytes.NewReader(body))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create ai request"})
		return
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "text/event-stream")
	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", api.config.AI.ServiceToken))

	resp, err := api.streamHTTPClient.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to reach ai service"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		raw, _ := io.ReadAll(resp.Body)
		c.JSON(http.StatusBadGateway, gin.H{"error": string(raw)})
		return
	}

	api.proxySSE(c, resp.Body)
}

func (api *AIRunAPI) InlineEdit(c *gin.Context) {
	var req inlineEditRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request, " + err.Error()})
		return
	}

	userVal, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	user := userVal.(*dbmodels.User)

	trimmedNoteID := strings.TrimSpace(req.NoteID)
	noteVersion := 0
	if trimmedNoteID != "" {
		note, err := api.noteService.GetNoteByID(c.Request.Context(), trimmedNoteID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "note not found"})
			return
		}
		if note.UserID != user.ID {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		noteVersion = note.Version
	}

	runID := uuid.NewString()
	if err := api.persistRun(c, user, runID, req.WorkspaceID, req.NoteID, ""); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to persist ai run"})
		return
	}

	if req.ExpectedVersion > 0 {
		noteVersion = req.ExpectedVersion
	}
	payload := map[string]interface{}{
		"run_id":   runID,
		"trace_id": c.GetString("trace_id"),
		"actor": map[string]string{
			"user_id":      user.ID,
			"tenant_id":    "",
			"workspace_id": req.WorkspaceID,
		},
		"action":         req.Action,
		"command":        req.Command,
		"mode":           req.Mode,
		"selected_text":  req.SelectedText,
		"context_blocks": req.ContextBlocks,
		"custom_prompt":  req.CustomPrompt,
		"resource_context": gin.H{
			"note_id":      req.NoteID,
			"note_version": noteVersion,
		},
		"policy": map[string]interface{}{
			"timeout_ms": api.config.AI.RequestTimeoutMs,
			"max_tokens": 1024,
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to prepare request"})
		return
	}

	aiURL := strings.TrimRight(api.config.AI.ServiceURL, "/") + "/internal/v1/agent/inline-edit"
	httpReq, err := http.NewRequestWithContext(c.Request.Context(), http.MethodPost, aiURL, bytes.NewReader(body))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create ai request"})
		return
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "application/json")
	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", api.config.AI.ServiceToken))

	resp, err := api.httpClient.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to reach ai service"})
		return
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		c.JSON(http.StatusBadGateway, gin.H{"error": string(raw)})
		return
	}

	c.Data(http.StatusOK, "application/json", raw)
}

func (api *AIRunAPI) InlineEditRun(c *gin.Context) {
	var req inlineEditRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request, " + err.Error()})
		return
	}

	userVal, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	user := userVal.(*dbmodels.User)

	trimmedNoteID := strings.TrimSpace(req.NoteID)
	noteVersion := 0
	if trimmedNoteID != "" {
		note, err := api.noteService.GetNoteByID(c.Request.Context(), trimmedNoteID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "note not found"})
			return
		}
		if note.UserID != user.ID {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		noteVersion = note.Version
	}

	runID := uuid.NewString()
	if err := api.persistRun(c, user, runID, req.WorkspaceID, req.NoteID, ""); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to persist ai run"})
		return
	}

	if req.ExpectedVersion > 0 {
		noteVersion = req.ExpectedVersion
	}
	payload := map[string]interface{}{
		"run_id":   runID,
		"trace_id": c.GetString("trace_id"),
		"actor": map[string]string{
			"user_id":      user.ID,
			"tenant_id":    "",
			"workspace_id": req.WorkspaceID,
		},
		"action":         req.Action,
		"command":        req.Command,
		"mode":           req.Mode,
		"selected_text":  req.SelectedText,
		"custom_prompt":  req.CustomPrompt,
		"context_blocks": req.ContextBlocks,
		"resource_context": gin.H{
			"note_id":      trimmedNoteID,
			"note_version": noteVersion,
		},
		"policy": map[string]interface{}{
			"timeout_ms": api.config.AI.RequestTimeoutMs,
			"max_tokens": 20_000,
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to prepare request"})
		return
	}

	aiURL := strings.TrimRight(api.config.AI.ServiceURL, "/") + "/internal/v1/agent/inline-edit/runs"
	httpReq, err := http.NewRequestWithContext(c.Request.Context(), http.MethodPost, aiURL, bytes.NewReader(body))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create ai request"})
		return
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "text/event-stream")
	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", api.config.AI.ServiceToken))

	resp, err := api.streamHTTPClient.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to reach ai service"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		raw, _ := io.ReadAll(resp.Body)
		c.JSON(http.StatusBadGateway, gin.H{"error": string(raw)})
		return
	}

	api.proxySSE(c, resp.Body)
}

func (api *AIRunAPI) ProvideConsent(c *gin.Context) {
	runID := c.Param("run_id")
	if runID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "run_id is required"})
		return
	}

	var req consentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request, " + err.Error()})
		return
	}

	userVal, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	user, ok := userVal.(*dbmodels.User)
	if !ok || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	if api.aiRuns != nil {
		run, err := api.aiRuns.GetRun(c.Request.Context(), runID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "run not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load run"})
			return
		}
		if run.UserID != user.ID {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		if _, err := api.aiRuns.GetToolCall(c.Request.Context(), runID, req.ToolCallID); err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "tool call not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load tool call"})
			return
		}
		if err := api.aiRuns.ApproveToolCall(c.Request.Context(), runID, req.ToolCallID, user.ID, req.Approved); err != nil {
			if errors.Is(err, repository.ErrAIToolCallNotPending) {
				c.JSON(http.StatusConflict, gin.H{"error": "tool call is not pending"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to audit consent"})
			return
		}
	}

	payload := map[string]interface{}{
		"run_id":       runID,
		"tool_call_id": req.ToolCallID,
		"approved":     req.Approved,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to prepare request"})
		return
	}

	aiURL := strings.TrimRight(api.config.AI.ServiceURL, "/") + "/internal/v1/agent/runs/" + runID + "/consent"
	httpReq, err := http.NewRequestWithContext(c.Request.Context(), http.MethodPatch, aiURL, bytes.NewReader(body))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create ai request"})
		return
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", api.config.AI.ServiceToken))

	resp, err := api.httpClient.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to reach ai service"})
		return
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		c.JSON(http.StatusBadGateway, gin.H{"error": string(raw)})
		return
	}

	c.Data(http.StatusOK, "application/json", raw)
}

func (api *AIRunAPI) proxySSE(c *gin.Context, reader io.Reader) {
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")
	c.Status(http.StatusOK)

	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "streaming unsupported"})
		return
	}

	bReader := bufio.NewReader(reader)
	var eventType string
	var dataLines [][]byte
	for {
		line, err := bReader.ReadBytes('\n')
		if len(line) > 0 {
			trimmed := bytes.TrimSpace(line)
			switch {
			case bytes.HasPrefix(trimmed, []byte("event:")):
				eventType = strings.TrimSpace(string(bytes.TrimPrefix(trimmed, []byte("event:"))))
			case bytes.HasPrefix(trimmed, []byte("data:")):
				dataLines = append(dataLines, bytes.TrimSpace(bytes.TrimPrefix(trimmed, []byte("data:"))))
			case len(trimmed) == 0:
				api.persistSSEFrame(c, eventType, dataLines)
				eventType = ""
				dataLines = nil
			}
			if _, writeErr := c.Writer.Write(line); writeErr != nil {
				return
			}
			flusher.Flush()
		}
		if err != nil {
			if errors.Is(err, io.EOF) {
				return
			}
			return
		}
	}
}

func (api *AIRunAPI) persistSSEFrame(c *gin.Context, eventType string, dataLines [][]byte) {
	if api.aiRuns == nil || len(dataLines) == 0 {
		return
	}

	data := bytes.Join(dataLines, nil)
	var payload map[string]interface{}
	if err := json.Unmarshal(data, &payload); err != nil {
		return
	}

	runID, _ := payload["run_id"].(string)
	if runID == "" {
		return
	}
	if eventType == "" {
		eventType, _ = payload["type"].(string)
	}
	eventID, _ := payload["event_id"].(string)
	if eventID == "" {
		eventID = uuid.NewString()
	}

	_ = api.aiRuns.AppendEvent(c.Request.Context(), &dbmodels.AIRunEvent{
		RunID:     runID,
		EventID:   eventID,
		EventType: eventType,
		Payload:   datatypes.JSON(data),
	})

	switch eventType {
	case "run.started":
		resumeToken, _ := payload["resume_token"].(string)
		_ = api.aiRuns.SetRunResume(c.Request.Context(), runID, resumeToken, eventID)
	case "run.awaiting_consent":
		_ = api.aiRuns.UpdateRunStatus(c.Request.Context(), runID, dbmodels.AIRunStatusAwaitingConsent)
		api.persistPendingConsent(c, runID, payload)
	case "run.completed":
		_ = api.aiRuns.UpdateRunStatus(c.Request.Context(), runID, dbmodels.AIRunStatusCompleted)
	case "run.failed":
		_ = api.aiRuns.UpdateRunStatus(c.Request.Context(), runID, dbmodels.AIRunStatusFailed)
	default:
		_ = api.aiRuns.SetRunResume(c.Request.Context(), runID, "", eventID)
	}
}

func (api *AIRunAPI) persistPendingConsent(c *gin.Context, runID string, payload map[string]interface{}) {
	consent, ok := payload["consent"].(map[string]interface{})
	if !ok {
		return
	}
	toolCallID, _ := consent["tool_call_id"].(string)
	tool, _ := consent["tool"].(string)
	summary, _ := consent["summary"].(string)
	if toolCallID == "" || tool == "" {
		return
	}
	args, _ := json.Marshal(consent)
	expiresAt := time.Now().UTC().Add(5 * time.Minute)
	_ = api.aiRuns.UpsertPendingToolCall(c.Request.Context(), &dbmodels.AIToolCall{
		RunID:      runID,
		ToolCallID: toolCallID,
		Tool:       tool,
		Status:     dbmodels.AIToolCallStatusPending,
		Summary:    summary,
		Args:       datatypes.JSON(args),
		ExpiresAt:  &expiresAt,
	})
}
