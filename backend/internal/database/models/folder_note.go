package models

// FolderNote represents the many-to-many relationship between folders and notes
type FolderNote struct {
    FolderID string `gorm:"type:uuid;primaryKey" json:"folder_id"`
    NoteID   string `gorm:"type:uuid;primaryKey" json:"note_id"`
}

// TableName returns the table name for FolderNote
func (FolderNote) TableName() string {
	return "folder_notes"
}
