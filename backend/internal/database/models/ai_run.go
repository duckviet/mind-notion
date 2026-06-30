package models

import (
	"time"

	"gorm.io/datatypes"
)

type AIRunStatus string

const (
	AIRunStatusRunning         AIRunStatus = "running"
	AIRunStatusAwaitingConsent AIRunStatus = "awaiting_consent"
	AIRunStatusCompleted       AIRunStatus = "completed"
	AIRunStatusFailed          AIRunStatus = "failed"
)

type AIToolCallStatus string

const (
	AIToolCallStatusPending  AIToolCallStatus = "pending"
	AIToolCallStatusApproved AIToolCallStatus = "approved"
	AIToolCallStatusRejected AIToolCallStatus = "rejected"
	AIToolCallStatusExpired  AIToolCallStatus = "expired"
)

type AIRun struct {
	BaseModel
	RunID          string         `gorm:"type:varchar(64);uniqueIndex;not null" json:"run_id"`
	UserID         string         `gorm:"type:varchar(64);index;not null" json:"user_id"`
	WorkspaceID    string         `gorm:"type:varchar(128);index;not null" json:"workspace_id"`
	NoteID         string         `gorm:"type:varchar(64);index" json:"note_id"`
	SessionID      string         `gorm:"type:varchar(128);index;not null" json:"session_id"`
	ConversationID *string        `gorm:"type:uuid;index" json:"conversation_id"`
	Status         AIRunStatus    `gorm:"type:varchar(32);index;not null" json:"status"`
	ResumeToken    string         `gorm:"type:varchar(64);index" json:"resume_token"`
	LastEventID    string         `gorm:"type:varchar(64)" json:"last_event_id"`
	Metadata       datatypes.JSON `gorm:"type:jsonb" json:"metadata"`
}

type AIToolCall struct {
	BaseModel
	RunID      string           `gorm:"type:varchar(64);index;not null" json:"run_id"`
	ToolCallID string           `gorm:"type:varchar(128);index;not null" json:"tool_call_id"`
	Tool       string           `gorm:"type:varchar(128);not null" json:"tool"`
	Status     AIToolCallStatus `gorm:"type:varchar(32);index;not null" json:"status"`
	Summary    string           `gorm:"type:text" json:"summary"`
	Args       datatypes.JSON   `gorm:"type:jsonb" json:"args"`
	ExpiresAt  *time.Time       `json:"expires_at"`
	ApprovedBy string           `gorm:"type:varchar(64)" json:"approved_by"`
	ApprovedAt *time.Time       `json:"approved_at"`
}

type AIRunEvent struct {
	BaseModel
	RunID     string         `gorm:"type:varchar(64);index;not null" json:"run_id"`
	EventID   string         `gorm:"type:varchar(64);index;not null" json:"event_id"`
	EventType string         `gorm:"type:varchar(64);index;not null" json:"event_type"`
	Payload   datatypes.JSON `gorm:"type:jsonb;not null" json:"payload"`
}

type AIConversation struct {
	BaseModel
	UserID        string    `gorm:"type:varchar(64);index;not null" json:"user_id"`
	Title         string    `gorm:"type:varchar(160);not null" json:"title"`
	LastMessageAt time.Time `gorm:"index;not null" json:"last_message_at"`
	IsDeleted     bool      `gorm:"index;not null;default:false" json:"is_deleted"`
}

type AIConversationMessage struct {
	BaseModel
	ConversationID string         `gorm:"type:uuid;index;not null" json:"conversation_id"`
	RunID          string         `gorm:"type:varchar(64);index" json:"run_id"`
	Role           string         `gorm:"type:varchar(32);index;not null" json:"role"`
	Content        string         `gorm:"type:text;not null" json:"content"`
	Metadata       datatypes.JSON `gorm:"type:jsonb" json:"metadata"`
}
