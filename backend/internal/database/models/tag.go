package models

// Tag represents a tag in the system
type Tag struct {
	BaseModel
	Name      string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"name"`
	Color     string    `gorm:"type:varchar(7);default:'#3B82F6'" json:"color"`

	// Relationships
	Notes []Note `gorm:"many2many:note_tags;constraint:OnDelete:CASCADE" json:"notes,omitempty"`
}

// TableName returns the table name for Tag
func (Tag) TableName() string {
	return "tags"
}
