package models

import "time"

// GoogleToken stores OAuth2 tokens for Google Calendar integration per user
type GoogleToken struct {
	ID           string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID       string    `gorm:"type:uuid;not null;uniqueIndex" json:"user_id"`
	AccessToken  string    `gorm:"type:text;not null" json:"-"`
	RefreshToken string    `gorm:"type:text;not null" json:"-"`
	ExpiresAt    time.Time `gorm:"not null" json:"expires_at"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	User *User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
}

func (GoogleToken) TableName() string { return "google_tokens" }
