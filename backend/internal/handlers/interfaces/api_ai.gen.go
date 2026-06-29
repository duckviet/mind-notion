package interfaces

import "github.com/gin-gonic/gin"

type AIAPIHandler interface {
	CreateAiConversation(c *gin.Context)
	CreateAiRun(c *gin.Context)
	DeleteAiConversation(c *gin.Context)
	GetAiConversation(c *gin.Context)
	InlineEditAi(c *gin.Context)
	InlineEditAiRun(c *gin.Context)
	ListAiConversations(c *gin.Context)
	ProvideAiRunConsent(c *gin.Context)
	UpdateAiConversation(c *gin.Context)
}
