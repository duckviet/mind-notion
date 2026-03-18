package models

import (
	"time"

	"github.com/lib/pq"
)

// AccountProvider represents an OAuth provider.
type AccountProvider string

// AccountServiceType represents a connected service category.
type AccountServiceType string

const (
	AccountProviderEmail      AccountProvider = "email"
	AccountProviderGoogle     AccountProvider = "google"
	AccountProviderMicrosoft  AccountProvider = "microsoft"
	AccountProviderApple      AccountProvider = "apple"
	AccountProviderGitHub     AccountProvider = "github"
)

const (
	AccountServiceAuth     AccountServiceType = "auth"
	AccountServiceCalendar AccountServiceType = "calendar"
	AccountServiceGmail    AccountServiceType = "gmail"
	AccountServiceDrive    AccountServiceType = "drive"
	AccountServiceMeet     AccountServiceType = "meet"
)

// Account stores OAuth identity and service tokens linked to a user.
type Account struct {
	BaseModel

	UserID            string             `gorm:"type:uuid;not null;index" json:"user_id"`
	Provider          AccountProvider    `gorm:"type:varchar(30);not null;index" json:"provider"`
	ProviderAccountID string             `gorm:"type:varchar(191);not null" json:"provider_account_id"`
	ServiceType       AccountServiceType `gorm:"type:varchar(30);not null;index" json:"service_type"`

	AccessToken  *string    `gorm:"type:text" json:"-"`
	RefreshToken *string    `gorm:"type:text" json:"-"`
	ExpiresAt    *time.Time `json:"expires_at,omitempty"`
	TokenType    *string    `gorm:"type:varchar(20)" json:"token_type,omitempty"`
	Scope        pq.StringArray `gorm:"type:text[]" json:"scope,omitempty"`

	IsConnected  bool       `gorm:"not null;default:true;index" json:"is_connected"`
	LastSyncAt   *time.Time `json:"last_sync_at,omitempty"`
	LastFailedAt *time.Time `json:"last_failed_at,omitempty"`

	User *User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
}

func (Account) TableName() string {
	return "accounts"
}