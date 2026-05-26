package interfaces

import "github.com/gin-gonic/gin"

type CommentAPIHandler interface {
	CommentDetail(c *gin.Context)
	CreateComment(c *gin.Context)
	DeleteComment(c *gin.Context)
	ListComments(c *gin.Context)
	UpdateComment(c *gin.Context)
}
