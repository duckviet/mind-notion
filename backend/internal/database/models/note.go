package models

// Note represents a note in the system
type Note struct {
	BaseModel
	Title       string    `gorm:"type:varchar(200);not null" json:"title"`
	Content     string    `gorm:"type:text" json:"content"`
	ContentType string    `gorm:"type:varchar(50);default:'text'" json:"content_type"`
	Status      NoteStatus `gorm:"type:varchar(20);default:'draft'" json:"status"`
	TopOfMind   bool      `gorm:"default:false" json:"top_of_mind"`
	Thumbnail   string    `gorm:"type:text" json:"thumbnail"`
	IsPublic    bool      `gorm:"default:false" json:"is_public"`

	// Foreign Keys
	UserID   string  `gorm:"type:uuid;not null" json:"user_id"`
	FolderID *string `gorm:"type:uuid;index" json:"folder_id,omitempty"`

	// Relationships
	User   User    `gorm:"foreignKey:UserID;references:ID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
	Folder *Folder `gorm:"foreignKey:FolderID;references:ID;constraint:OnDelete:SET NULL" json:"folder,omitempty"`
	Tags   []Tag   `gorm:"many2many:note_tags;constraint:OnDelete:CASCADE" json:"tags,omitempty"`

	Version int `gorm:"default:0" json:"version"`
}

// NoteStatus represents the status of a note
type NoteStatus string

const (
	NoteStatusDraft     NoteStatus = "draft"
	NoteStatusPublished NoteStatus = "published"
	NoteStatusArchived  NoteStatus = "archived"
)

// TableName returns the table name for Note
func (Note) TableName() string {
	return "notes"
}
