package interfaces

import "github.com/gin-gonic/gin"

type NoteAPIHandler interface {
	CreateNote(c *gin.Context)
	DeleteNote(c *gin.Context)
	GetNote(c *gin.Context)
	GetPublicEditSettings(c *gin.Context)
	GetPublicNote(c *gin.Context)
	ListNotes(c *gin.Context)
	ListNotesTOM(c *gin.Context)
	RotatePublicEditToken(c *gin.Context)
	SaveNoteSnapshot(c *gin.Context)
	SaveNoteTiptapSnapshot(c *gin.Context)
	UpdateNote(c *gin.Context)
	UpdateNoteTOM(c *gin.Context)
	UpdatePublicEditSettings(c *gin.Context)
}
