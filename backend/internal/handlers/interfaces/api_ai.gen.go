package interfaces

import "github.com/gin-gonic/gin"

type AIAPIHandler interface {
	CreateAiRun(c *gin.Context)
	InlineEditAi(c *gin.Context)
	InlineEditAiRun(c *gin.Context)
	ProvideAiRunConsent(c *gin.Context)
}
