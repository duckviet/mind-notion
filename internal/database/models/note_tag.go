package models

// NoteTag represents the many-to-many relationship between notes and tags
type NoteTag struct {
    NoteID string `gorm:"type:uuid;primaryKey" json:"note_id"`
    TagID  string `gorm:"type:uuid;primaryKey" json:"tag_id"`
}

// TableName returns the table name for NoteTag
func (NoteTag) TableName() string {
	return "note_tags"
}
