package models

// NoteTag represents the many-to-many relationship between notes and tags
type NoteTag struct {
	NoteID uint `gorm:"primaryKey" json:"note_id"`
	TagID  uint `gorm:"primaryKey" json:"tag_id"`
}

// TableName returns the table name for NoteTag
func (NoteTag) TableName() string {
	return "note_tags"
}
