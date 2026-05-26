package interfaces

import "github.com/gin-gonic/gin"

type TemplateAPIHandler interface {
	CreateTemplate(c *gin.Context)
	DeleteTemplate(c *gin.Context)
	GetTemplate(c *gin.Context)
	ListTemplates(c *gin.Context)
	UpdateTemplate(c *gin.Context)
}
