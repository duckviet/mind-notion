package interfaces

import "github.com/gin-gonic/gin"

type UserAPIHandler interface {
	DeleteMe(c *gin.Context)
	GetMe(c *gin.Context)
	UpdateMe(c *gin.Context)
}
