package models

// Folder represents a folder in the system
type Folder struct {
	BaseModel
	Name      string    `gorm:"type:varchar(100);not null" json:"name"`
	IsPublic  bool      `gorm:"default:false" json:"is_public"`

	// Foreign Keys
	UserID   uint   `gorm:"not null" json:"user_id"`
	ParentID *uint  `gorm:"index" json:"parent_id,omitempty"`

	// Relationships
	User           User      `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
	Parent         *Folder   `gorm:"foreignKey:ParentID;constraint:OnDelete:SET NULL" json:"parent,omitempty"`
	Children       []Folder  `gorm:"foreignKey:ParentID;constraint:OnDelete:CASCADE" json:"children,omitempty"`
	Notes          []Note    `gorm:"many2many:folder_notes;constraint:OnDelete:CASCADE" json:"notes,omitempty"`
}

// TableName returns the table name for Folder
func (Folder) TableName() string {
	return "folders"
}
