package interfaces

import "github.com/gin-gonic/gin"

type MediaAPIHandler interface {
	UploadMedia(c *gin.Context)
}
