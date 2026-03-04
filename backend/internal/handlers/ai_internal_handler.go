package handlers

import (
	"errors"
	"net/http"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/config"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/service"
	"github.com/gin-gonic/gin"
)

type AIInternalAPI struct {
	noteService service.NoteService
	config      *config.Config
}

func NewAIInternalAPI(noteService service.NoteService, cfg *config.Config) *AIInternalAPI {
	return &AIInternalAPI{noteService: noteService, config: cfg}
}

type aiActor struct {
	UserID      string `json:"user_id"`
	TenantID    string `json:"tenant_id"`
	WorkspaceID string `json:"workspace_id"`
}

type aiToolExecuteRequest struct {
	RunID      string                 `json:"run_id" binding:"required"`
	ToolCallID string                 `json:"tool_call_id" binding:"required"`
	Tool       string                 `json:"tool" binding:"required"`
	Actor      aiActor                `json:"actor" binding:"required"`
	Input      map[string]interface{} `json:"input" binding:"required"`
}

type aiToolError struct {
	Code      string `json:"code"`
	Message   string `json:"message"`
	Retryable bool   `json:"retryable"`
}

type aiToolResponse struct {
	OK         bool         `json:"ok"`
	ToolCallID string       `json:"tool_call_id"`
	Output     interface{}  `json:"output,omitempty"`
	Error      *aiToolError `json:"error,omitempty"`
}

func (api *AIInternalAPI) ExecuteTool(c *gin.Context) {
	if !api.isAuthorized(c) {
		c.JSON(http.StatusUnauthorized, aiToolResponse{
			OK:         false,
			ToolCallID: "",
			Error: &aiToolError{
				Code:      "UNAUTHORIZED",
				Message:   "invalid service token",
				Retryable: false,
			},
		})
		return
	}

	var req aiToolExecuteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, aiToolResponse{
			OK:         false,
			ToolCallID: req.ToolCallID,
			Error: &aiToolError{
				Code:      "INVALID_INPUT",
				Message:   err.Error(),
				Retryable: false,
			},
		})
		return
	}

	switch req.Tool {
	case "notes.read":
		api.executeNotesRead(c, req)
	case "notes.write":
		api.executeNotesWrite(c, req)
	default:
		c.JSON(http.StatusBadRequest, aiToolResponse{
			OK:         false,
			ToolCallID: req.ToolCallID,
			Error: &aiToolError{
				Code:      "INVALID_INPUT",
				Message:   "unsupported tool",
				Retryable: false,
			},
		})
	}
}

func (api *AIInternalAPI) executeNotesRead(c *gin.Context, req aiToolExecuteRequest) {
	noteID, _ := req.Input["note_id"].(string)
	if noteID == "" {
		c.JSON(http.StatusBadRequest, aiToolResponse{
			OK:         false,
			ToolCallID: req.ToolCallID,
			Error:      &aiToolError{Code: "INVALID_INPUT", Message: "note_id is required", Retryable: false},
		})
		return
	}

	note, err := api.noteService.GetNoteByID(c.Request.Context(), noteID)
	if err != nil {
		c.JSON(http.StatusNotFound, aiToolResponse{
			OK:         false,
			ToolCallID: req.ToolCallID,
			Error:      &aiToolError{Code: "NOT_FOUND", Message: "note not found", Retryable: false},
		})
		return
	}

	if note.UserID != req.Actor.UserID {
		c.JSON(http.StatusForbidden, aiToolResponse{
			OK:         false,
			ToolCallID: req.ToolCallID,
			Error:      &aiToolError{Code: "FORBIDDEN", Message: "missing permission note:read", Retryable: false},
		})
		return
	}

	c.JSON(http.StatusOK, aiToolResponse{
		OK:         true,
		ToolCallID: req.ToolCallID,
		Output: gin.H{
			"note_id":    note.ID,
			"content":    note.Content,
			"version":    note.Version,
			"updated_at": note.UpdatedAt,
		},
	})
}

func (api *AIInternalAPI) executeNotesWrite(c *gin.Context, req aiToolExecuteRequest) {
	noteID, _ := req.Input["note_id"].(string)
	operation, _ := req.Input["operation"].(string)
	content, _ := req.Input["content"].(string)

	if noteID == "" || operation == "" {
		c.JSON(http.StatusBadRequest, aiToolResponse{
			OK:         false,
			ToolCallID: req.ToolCallID,
			Error:      &aiToolError{Code: "INVALID_INPUT", Message: "note_id and operation are required", Retryable: false},
		})
		return
	}

	versionValue, ok := req.Input["expected_version"]
	if !ok {
		c.JSON(http.StatusBadRequest, aiToolResponse{
			OK:         false,
			ToolCallID: req.ToolCallID,
			Error:      &aiToolError{Code: "INVALID_INPUT", Message: "expected_version is required", Retryable: false},
		})
		return
	}

	expectedVersionFloat, ok := versionValue.(float64)
	if !ok {
		c.JSON(http.StatusBadRequest, aiToolResponse{
			OK:         false,
			ToolCallID: req.ToolCallID,
			Error:      &aiToolError{Code: "INVALID_INPUT", Message: "expected_version must be numeric", Retryable: false},
		})
		return
	}
	expectedVersion := int(expectedVersionFloat)

	note, err := api.noteService.GetNoteByID(c.Request.Context(), noteID)
	if err != nil {
		c.JSON(http.StatusNotFound, aiToolResponse{
			OK:         false,
			ToolCallID: req.ToolCallID,
			Error:      &aiToolError{Code: "NOT_FOUND", Message: "note not found", Retryable: false},
		})
		return
	}

	if note.UserID != req.Actor.UserID {
		c.JSON(http.StatusForbidden, aiToolResponse{
			OK:         false,
			ToolCallID: req.ToolCallID,
			Error:      &aiToolError{Code: "FORBIDDEN", Message: "missing permission note:write", Retryable: false},
		})
		return
	}

	newContent := content
	switch operation {
	case "replace":
		// keep content as-is
	case "append":
		newContent = note.Content + content
	case "patch":
		c.JSON(http.StatusBadRequest, aiToolResponse{
			OK:         false,
			ToolCallID: req.ToolCallID,
			Error:      &aiToolError{Code: "INVALID_INPUT", Message: "patch operation is not supported in MVP", Retryable: false},
		})
		return
	default:
		c.JSON(http.StatusBadRequest, aiToolResponse{
			OK:         false,
			ToolCallID: req.ToolCallID,
			Error:      &aiToolError{Code: "INVALID_INPUT", Message: "unsupported operation", Retryable: false},
		})
		return
	}

	updated, err := api.noteService.UpdateNoteContentWithVersion(c.Request.Context(), noteID, newContent, expectedVersion)
	if err != nil {
		if errors.Is(err, service.ErrVersionConflict) {
			c.JSON(http.StatusConflict, aiToolResponse{
				OK:         false,
				ToolCallID: req.ToolCallID,
				Error:      &aiToolError{Code: "VERSION_CONFLICT", Message: "version conflict", Retryable: true},
			})
			return
		}
		if errors.Is(err, service.ErrNoteNotFound) {
			c.JSON(http.StatusNotFound, aiToolResponse{
				OK:         false,
				ToolCallID: req.ToolCallID,
				Error:      &aiToolError{Code: "NOT_FOUND", Message: "note not found", Retryable: false},
			})
			return
		}

		c.JSON(http.StatusInternalServerError, aiToolResponse{
			OK:         false,
			ToolCallID: req.ToolCallID,
			Error:      &aiToolError{Code: "INTERNAL", Message: err.Error(), Retryable: false},
		})
		return
	}

	c.JSON(http.StatusOK, aiToolResponse{
		OK:         true,
		ToolCallID: req.ToolCallID,
		Output: gin.H{
			"note_id":     updated.ID,
			"new_version": updated.Version,
		},
	})
}

func (api *AIInternalAPI) isAuthorized(c *gin.Context) bool {
	if api.config == nil {
		return false
	}

	expected := api.config.AI.ServiceToken
	if expected == "" {
		return false
	}

	provided := extractBearerToken(c)
	return provided == expected
}
