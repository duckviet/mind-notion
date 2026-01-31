package models

// Comment represents a comment on a note
type Comment struct {
	BaseModel
	NoteID    string  `gorm:"type:uuid;not null;index" json:"note_id"`
	UserID    string  `gorm:"type:uuid;not null" json:"user_id"`
	Content   string  `gorm:"type:text;not null" json:"content"`
	ParentID  *string `gorm:"type:uuid;index" json:"parent_id"`

	// Relationships
	Note   Note      `gorm:"foreignKey:NoteID;references:ID;constraint:OnDelete:CASCADE" json:"note,omitempty"`
	User   User      `gorm:"foreignKey:UserID;references:ID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
	Parent *Comment  `gorm:"foreignKey:ParentID;references:ID;constraint:OnDelete:CASCADE" json:"parent,omitempty"`
	Replies []Comment `gorm:"foreignKey:ParentID;references:ID;constraint:OnDelete:CASCADE" json:"replies,omitempty"`
}
