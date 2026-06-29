package repository

import (
	"context"
	"errors"
	"time"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/database"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

var ErrAIToolCallNotPending = errors.New("ai tool call is not pending")

type AIRunRepository interface {
	CreateRun(ctx context.Context, run *models.AIRun) error
	GetRun(ctx context.Context, runID string) (*models.AIRun, error)
	UpdateRunStatus(ctx context.Context, runID string, status models.AIRunStatus) error
	SetRunResume(ctx context.Context, runID, resumeToken, lastEventID string) error
	AppendEvent(ctx context.Context, event *models.AIRunEvent) error
	ListEventsAfter(ctx context.Context, runID, lastEventID string, limit int) ([]models.AIRunEvent, error)
	UpsertPendingToolCall(ctx context.Context, call *models.AIToolCall) error
	ApproveToolCall(ctx context.Context, runID, toolCallID, userID string, approved bool) error
	GetToolCall(ctx context.Context, runID, toolCallID string) (*models.AIToolCall, error)
	ExpirePendingToolCalls(ctx context.Context, now time.Time) error
	CreateConversation(ctx context.Context, conversation *models.AIConversation) error
	ListConversations(ctx context.Context, userID string, limit int) ([]models.AIConversation, error)
	GetConversation(ctx context.Context, conversationID, userID string) (*models.AIConversation, error)
	UpdateConversationTitle(ctx context.Context, conversationID, userID, title string) error
	SoftDeleteConversation(ctx context.Context, conversationID, userID string) error
	AppendConversationMessage(ctx context.Context, message *models.AIConversationMessage) error
	ListConversationMessages(ctx context.Context, conversationID string) ([]models.AIConversationMessage, error)
}

type aiRunRepository struct {
	db *gorm.DB
}

func NewAIRunRepository(db *database.DB) AIRunRepository {
	return &aiRunRepository{db: db.DB}
}

func (r *aiRunRepository) CreateRun(ctx context.Context, run *models.AIRun) error {
	return r.db.WithContext(ctx).Create(run).Error
}

func (r *aiRunRepository) GetRun(ctx context.Context, runID string) (*models.AIRun, error) {
	var run models.AIRun
	if err := r.db.WithContext(ctx).Where("run_id = ?", runID).First(&run).Error; err != nil {
		return nil, err
	}
	return &run, nil
}

func (r *aiRunRepository) UpdateRunStatus(ctx context.Context, runID string, status models.AIRunStatus) error {
	return r.db.WithContext(ctx).
		Model(&models.AIRun{}).
		Where("run_id = ?", runID).
		Update("status", status).
		Error
}

func (r *aiRunRepository) SetRunResume(ctx context.Context, runID, resumeToken, lastEventID string) error {
	return r.db.WithContext(ctx).
		Model(&models.AIRun{}).
		Where("run_id = ?", runID).
		Updates(map[string]interface{}{
			"resume_token":  resumeToken,
			"last_event_id": lastEventID,
		}).
		Error
}

func (r *aiRunRepository) AppendEvent(ctx context.Context, event *models.AIRunEvent) error {
	return r.db.WithContext(ctx).Create(event).Error
}

func (r *aiRunRepository) ListEventsAfter(ctx context.Context, runID, lastEventID string, limit int) ([]models.AIRunEvent, error) {
	if limit <= 0 || limit > 200 {
		limit = 200
	}

	query := r.db.WithContext(ctx).
		Where("run_id = ?", runID).
		Order("created_at ASC").
		Order("id ASC").
		Limit(limit)
	if lastEventID != "" {
		query = query.Where("event_id <> ? AND created_at > COALESCE((SELECT created_at FROM ai_run_events WHERE run_id = ? AND event_id = ? LIMIT 1), '-infinity')", lastEventID, runID, lastEventID)
	}

	var events []models.AIRunEvent
	return events, query.Find(&events).Error
}

func (r *aiRunRepository) UpsertPendingToolCall(ctx context.Context, call *models.AIToolCall) error {
	return r.db.WithContext(ctx).Where(
		"run_id = ? AND tool_call_id = ?",
		call.RunID,
		call.ToolCallID,
	).Assign(map[string]interface{}{
		"tool":       call.Tool,
		"status":     models.AIToolCallStatusPending,
		"summary":    call.Summary,
		"args":       datatypes.JSON(call.Args),
		"expires_at": call.ExpiresAt,
	}).FirstOrCreate(call).Error
}

func (r *aiRunRepository) ApproveToolCall(ctx context.Context, runID, toolCallID, userID string, approved bool) error {
	status := models.AIToolCallStatusRejected
	if approved {
		status = models.AIToolCallStatusApproved
	}

	now := time.Now().UTC()
	result := r.db.WithContext(ctx).
		Model(&models.AIToolCall{}).
		Where("run_id = ? AND tool_call_id = ? AND status = ?", runID, toolCallID, models.AIToolCallStatusPending).
		Updates(map[string]interface{}{
			"status":      status,
			"approved_by": userID,
			"approved_at": &now,
		})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrAIToolCallNotPending
	}
	return nil
}

func (r *aiRunRepository) GetToolCall(ctx context.Context, runID, toolCallID string) (*models.AIToolCall, error) {
	var call models.AIToolCall
	if err := r.db.WithContext(ctx).
		Where("run_id = ? AND tool_call_id = ?", runID, toolCallID).
		First(&call).Error; err != nil {
		return nil, err
	}
	return &call, nil
}

func (r *aiRunRepository) ExpirePendingToolCalls(ctx context.Context, now time.Time) error {
	return r.db.WithContext(ctx).
		Model(&models.AIToolCall{}).
		Where("status = ? AND expires_at IS NOT NULL AND expires_at < ?", models.AIToolCallStatusPending, now).
		Update("status", models.AIToolCallStatusExpired).
		Error
}

func (r *aiRunRepository) CreateConversation(ctx context.Context, conversation *models.AIConversation) error {
	return r.db.WithContext(ctx).Create(conversation).Error
}

func (r *aiRunRepository) ListConversations(ctx context.Context, userID string, limit int) ([]models.AIConversation, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	var conversations []models.AIConversation
	return conversations, r.db.WithContext(ctx).
		Where("user_id = ? AND is_deleted = ?", userID, false).
		Order("last_message_at DESC").
		Order("created_at DESC").
		Limit(limit).
		Find(&conversations).Error
}

func (r *aiRunRepository) GetConversation(ctx context.Context, conversationID, userID string) (*models.AIConversation, error) {
	var conversation models.AIConversation
	if err := r.db.WithContext(ctx).
		Where("id = ? AND user_id = ? AND is_deleted = ?", conversationID, userID, false).
		First(&conversation).Error; err != nil {
		return nil, err
	}
	return &conversation, nil
}

func (r *aiRunRepository) UpdateConversationTitle(ctx context.Context, conversationID, userID, title string) error {
	return r.db.WithContext(ctx).
		Model(&models.AIConversation{}).
		Where("id = ? AND user_id = ? AND is_deleted = ?", conversationID, userID, false).
		Update("title", title).
		Error
}

func (r *aiRunRepository) SoftDeleteConversation(ctx context.Context, conversationID, userID string) error {
	return r.db.WithContext(ctx).
		Model(&models.AIConversation{}).
		Where("id = ? AND user_id = ? AND is_deleted = ?", conversationID, userID, false).
		Update("is_deleted", true).
		Error
}

func (r *aiRunRepository) AppendConversationMessage(ctx context.Context, message *models.AIConversationMessage) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(message).Error; err != nil {
			return err
		}
		return tx.Model(&models.AIConversation{}).
			Where("id = ?", message.ConversationID).
			Update("last_message_at", message.CreatedAt).
			Error
	})
}

func (r *aiRunRepository) ListConversationMessages(ctx context.Context, conversationID string) ([]models.AIConversationMessage, error) {
	var messages []models.AIConversationMessage
	return messages, r.db.WithContext(ctx).
		Where("conversation_id = ?", conversationID).
		Order("created_at ASC").
		Order("id ASC").
		Find(&messages).Error
}
