package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
	"github.com/stretchr/testify/require"
)

func TestAIRunInlineEditForwardsAgentContract(t *testing.T) {
	t.Parallel()

	var received map[string]any
	router, _ := newAIRunHandlerTestRouter(t, func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "/internal/v1/agent/inline-edit/runs", r.URL.Path)
		require.Equal(t, "Bearer test-service-token", r.Header.Get("Authorization"))
		require.NoError(t, json.NewDecoder(r.Body).Decode(&received))
		w.Header().Set("content-type", "application/json")
		_, _ = w.Write([]byte(`{"run_id":"run-1","events":[{"event":"complete","data":{"type":"complete","result":{"type":"edit_proposal","original":"hello","proposed":"hello world","summary":"expanded","confidence":0.9}}}]}`))
	}, &models.Note{UserID: "user-1"})

	body := bytes.NewBufferString(`{
		"action":"expand",
		"command":"/expand",
		"mode":"inline_transform",
		"selected_text":"hello",
		"context_blocks":[{"type":"editor_context","content":"note context"}],
		"workspace_id":"workspace-1",
		"note_id":"note-1",
		"expected_version":4,
		"resource_context":{"workspace_id":"workspace-1","note_id":"note-1","expected_version":4}
	}`)
	request := httptest.NewRequest(http.MethodPost, "/api/v1/ai/inline-edit/runs", body)
	request.Header.Set("content-type", "application/json")
	response := httptest.NewRecorder()

	router.ServeHTTP(response, request)

	require.Equal(t, http.StatusOK, response.Code, response.Body.String())
	require.Equal(t, "expand", received["action"])
	require.Equal(t, "/expand", received["command"])
	require.Equal(t, "inline_transform", received["mode"])
	require.Equal(t, "hello", received["selected_text"])
	require.Equal(t, []any{map[string]any{"type": "editor_context", "content": "note context"}}, received["context_blocks"])
	require.Equal(t, map[string]any{
		"note_version": float64(4),
		"note_id":      "note-1",
	}, received["resource_context"])
}

func TestAIRunConsentRequiresRunOwner(t *testing.T) {
	t.Parallel()

	router, repo := newAIRunHandlerTestRouter(t, func(w http.ResponseWriter, r *http.Request) {
		t.Fatalf("python service should not be called for rejected consent")
	}, &models.Note{UserID: "user-1"})
	repo.mustCreateRun(t, &models.AIRun{
		BaseModel: models.BaseModel{ID: "run-owner-2"},
		UserID:    "user-2",
		Status:    models.AIRunStatusAwaitingConsent,
	})
	repo.mustCreateToolCall(t, &models.AIToolCall{
		BaseModel: models.BaseModel{ID: "tool-1"},
		RunID:     "run-owner-2",
		Tool:      "notes.write",
		Status:    models.AIToolCallStatusPending,
		Args:      []byte(`{"note_id":"note-1"}`),
	})

	request := httptest.NewRequest(http.MethodPost, "/api/v1/ai/runs/run-owner-2/consent", bytes.NewBufferString(`{"tool_call_id":"tool-1","approved":true}`))
	request.Header.Set("content-type", "application/json")
	response := httptest.NewRecorder()

	router.ServeHTTP(response, request)

	require.Equal(t, http.StatusForbidden, response.Code, response.Body.String())
	toolCall := repo.mustGetToolCall(t, "tool-1")
	require.Equal(t, models.AIToolCallStatusPending, toolCall.Status)
}

func TestAIRunConsentPersistsApprovedAuditTrail(t *testing.T) {
	t.Parallel()

	router, repo := newAIRunHandlerTestRouter(t, func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "/internal/v1/agent/runs/run-approve/consent", r.URL.Path)
		w.Header().Set("content-type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	}, &models.Note{UserID: "user-1"})
	repo.mustCreateRun(t, &models.AIRun{
		BaseModel: models.BaseModel{ID: "run-approve"},
		UserID:    "user-1",
		Status:    models.AIRunStatusAwaitingConsent,
	})
	repo.mustCreateToolCall(t, &models.AIToolCall{
		BaseModel: models.BaseModel{ID: "tool-approve"},
		RunID:     "run-approve",
		Tool:      "notes.write",
		Status:    models.AIToolCallStatusPending,
		Args:      []byte(`{"note_id":"note-1"}`),
	})

	request := httptest.NewRequest(http.MethodPost, "/api/v1/ai/runs/run-approve/consent", bytes.NewBufferString(`{"tool_call_id":"tool-approve","approved":true}`))
	request.Header.Set("content-type", "application/json")
	response := httptest.NewRecorder()

	router.ServeHTTP(response, request)

	require.Equal(t, http.StatusOK, response.Code, response.Body.String())
	toolCall := repo.mustGetToolCall(t, "tool-approve")
	require.Equal(t, models.AIToolCallStatusApproved, toolCall.Status)
	require.Equal(t, "user-1", toolCall.ApprovedBy)
	require.NotNil(t, toolCall.ApprovedAt)
}
func TestAIRunCreatePersistsConversationMessages(t *testing.T) {
	note := &models.Note{
		BaseModel: models.BaseModel{ID: "note-1"},
		UserID:    "user-1",
		Version:   7,
	}
	router, repo := newAIRunHandlerTestRouter(t, func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "/internal/v1/agent/runs", r.URL.Path)

		var payload map[string]interface{}
		require.NoError(t, json.NewDecoder(r.Body).Decode(&payload))
		runID, ok := payload["run_id"].(string)
		require.True(t, ok)

		w.Header().Set("Content-Type", "text/event-stream")
		_, _ = fmt.Fprintf(w, "event: run.started\ndata: {\"run_id\":%q,\"resume_token\":\"resume-1\"}\n\n", runID)
		_, _ = fmt.Fprintf(w, "event: assistant.delta\ndata: {\"run_id\":%q,\"content\":\"Hello \"}\n\n", runID)
		_, _ = fmt.Fprintf(w, "event: assistant.delta\ndata: {\"run_id\":%q,\"content\":\"back\"}\n\n", runID)
		_, _ = fmt.Fprintf(w, "event: run.completed\ndata: {\"run_id\":%q}\n\n", runID)
	}, note)

	body := bytes.NewBufferString(`{
		"workspace_id":"workspace-1",
		"session_id":"session-1",
		"note_id":"note-1",
		"display_user_message":"Plain prompt",
		"message":{"role":"user","content":"Prompt with pinned note context"}
	}`)
	request := httptest.NewRequest(http.MethodPost, "/api/v1/ai/runs", body)
	request.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, request)

	require.Equal(t, http.StatusOK, recorder.Code)
	require.Contains(t, recorder.Body.String(), "conversation.created")

	repo.mu.Lock()
	defer repo.mu.Unlock()
	messages := repo.messages["conversation-id"]
	require.Len(t, messages, 2)
	require.Equal(t, "user", messages[0].Role)
	require.Equal(t, "Plain prompt", messages[0].Content)
	require.Equal(t, "assistant", messages[1].Role)
	require.Equal(t, "Hello back", messages[1].Content)
}
