package interfaces

import "github.com/gin-gonic/gin"

type CollabAPIHandler interface {
	CreateCollabToken(c *gin.Context)
}
