package models

// Comment represents a comment on a note
type Comment struct {
	BaseModel
	NoteID  string `gorm:"type:uuid;not null;index" json:"note_id"`
	UserID  string `gorm:"type:uuid;not null" json:"user_id"`
	Content string `gorm:"type:text;not null" json:"content"`

	// Relationships
	Note Note `gorm:"foreignKey:NoteID;references:ID;constraint:OnDelete:CASCADE" json:"note,omitempty"`
	User User `gorm:"foreignKey:UserID;references:ID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
}
