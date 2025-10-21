package models

import "time"

// User represents a user in the system
type User struct {
	BaseModel
	Username  string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"username"`
	Email     string    `gorm:"type:varchar(100);uniqueIndex;not null" json:"email"`
	Password  string    `gorm:"type:varchar(255);not null" json:"-"`
	Name      string    `gorm:"type:varchar(100)" json:"name"`
	Avatar    string    `gorm:"type:text" json:"avatar"`
	Status    UserStatus `gorm:"type:varchar(20);default:'active'" json:"status"`

	// Relationships
    Notes   []Note   `gorm:"foreignKey:UserID" json:"notes,omitempty"`
    Folders []Folder `gorm:"foreignKey:UserID" json:"folders,omitempty"`

    LastLoginAt *time.Time `json:"last_login_at,omitempty"`
}

// UserStatus represents the status of a user
type UserStatus string

const (
	UserStatusActive    UserStatus = "active"
	UserStatusInactive  UserStatus = "inactive"
	UserStatusSuspended UserStatus = "suspended"
)

// TableName returns the table name for User
func (User) TableName() string {
	return "users"
}
