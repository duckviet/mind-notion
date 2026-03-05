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
	"github.com/duckviet/gin-collaborative-editor/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AIRunAPI struct {
	config      *config.Config
	noteService service.NoteService
	httpClient  *http.Client
	streamHTTPClient *http.Client
}

func NewAIRunAPI(cfg *config.Config, noteService service.NoteService) *AIRunAPI {
	timeout := time.Duration(cfg.AI.RequestTimeoutMs) * time.Millisecond
	return &AIRunAPI{
		config:           cfg,
		noteService:      noteService,
		httpClient:       &http.Client{Timeout: timeout},
		streamHTTPClient: &http.Client{},
	}
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
	allowedTools := []map[string]interface{}{}

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
		allowedTools = []map[string]interface{}{
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
	}

	runID := uuid.NewString()
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
	for {
		line, err := bReader.ReadBytes('\n')
		if len(line) > 0 {
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
