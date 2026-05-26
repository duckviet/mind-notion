package interfaces

import "github.com/gin-gonic/gin"

type FolderAPIHandler interface {
	AddNoteToFolder(c *gin.Context)
	CreateFolder(c *gin.Context)
	DeleteFolder(c *gin.Context)
	GetFolder(c *gin.Context)
	ListFolders(c *gin.Context)
	ReorderFolders(c *gin.Context)
	UpdateFolder(c *gin.Context)
}
