package models

// Template represents a user-created note template
type Template struct {
	BaseModel
	Name    string `gorm:"type:varchar(100);not null" json:"name"`
	Icon    string `gorm:"type:varchar(50);not null;default:'FileText'" json:"icon"`
	Content string `gorm:"type:text;not null" json:"content"`
	Tags    string `gorm:"type:text" json:"tags"` // Stored as comma-separated values
	Color   string `gorm:"type:varchar(20)" json:"color"`

	// Foreign Keys
	UserID string `gorm:"type:uuid;not null" json:"user_id"`

	// Relationships
	User User `gorm:"foreignKey:UserID;references:ID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
}

// TableName returns the table name for Template
func (Template) TableName() string {
	return "templates"
}
