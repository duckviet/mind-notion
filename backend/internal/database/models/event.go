package models

import "time"

// EventType represents the type of event
type EventType string

const (
	EventTypeTask  EventType = "task"
	EventTypeEvent EventType = "event"
	EventTypeNote  EventType = "note"
)

// EventStatus represents the status of a task/event
type EventStatus string

const (
	EventStatusPending    EventStatus = "pending"
	EventStatusInProgress EventStatus = "in_progress"
	EventStatusCompleted  EventStatus = "completed"
	EventStatusCancelled  EventStatus = "cancelled"
)

// EventPriority represents the priority level
type EventPriority string

const (
	EventPriorityLow    EventPriority = "low"
	EventPriorityMedium EventPriority = "medium"
	EventPriorityHigh   EventPriority = "high"
	EventPriorityUrgent EventPriority = "urgent"
)

// Event is the GORM database model for events
type Event struct {
	ID          string     `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID      string     `gorm:"type:uuid;not null;index" json:"user_id"`
	Title       string     `gorm:"not null" json:"title"`
	Description string     `gorm:"type:text" json:"description"`
	Tags        []string   `gorm:"type:text[]" json:"tags"`
	Type        string     `gorm:"not null;index" json:"type"` // task, event, note
	StartTime   time.Time  `gorm:"not null;index" json:"start_time"`
	EndTime     *time.Time `json:"end_time"`
	DueDate     *time.Time `gorm:"type:date" json:"due_date"`
	Status      string     `gorm:"default:'pending'" json:"status"`
	Priority    string     `gorm:"default:'medium'" json:"priority"`
	CategoryID  *string    `gorm:"type:uuid;index" json:"category_id"`
	IsAllDay    bool       `gorm:"default:false" json:"is_all_day"`
	CreatedAt   time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	
	User        *User      `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
}

func (Event) TableName() string { return "events" }

// IsValid validates the event data
func (e *Event) IsValid() bool {
	if e.Title == "" {
		return false
	}
	if e.Type == "" {
		return false
	}
	if e.StartTime.IsZero() {
		return false
	}
	return true
}

// CreateEventRequest represents the data needed to create an event
type CreateEventRequest struct {
	UserID      string
	Title       string
	Description string
	Tags        []string
	Type        EventType
	StartTime   time.Time
	EndTime     *time.Time
	DueDate     *time.Time
	Status      EventStatus
	Priority    EventPriority
	CategoryID  *string
	IsAllDay    bool
}

// UpdateEventRequest represents the data needed to update an event
type UpdateEventRequest struct {
	Title       *string
	Description *string
	Tags        *[]string
	StartTime   *time.Time
	EndTime     *time.Time
	DueDate     *time.Time
	Status      *EventStatus
	Priority    *EventPriority
	CategoryID  *string
	IsAllDay    *bool
}

// EventFilter represents filter criteria for listing events
type EventFilter struct {
	UserID     string
	Type       *EventType
	Status     *EventStatus
	StartRange *time.Time
	EndRange   *time.Time
}
