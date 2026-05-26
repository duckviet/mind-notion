package interfaces

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type AIRunAPIHandler interface {
	CreateRun(c *gin.Context)
	InlineEdit(c *gin.Context)
	InlineEditRun(c *gin.Context)
	ProvideConsent(c *gin.Context)
}

type AIInternalAPIHandler interface {
	ExecuteTool(c *gin.Context)
}

type WebSocketHandler interface {
	HandleConnections(w http.ResponseWriter, r *http.Request)
}

type SearchHandler interface {
	SearchNotes(c *gin.Context)
	IndexNote(c *gin.Context)
	ReindexAllNotes(c *gin.Context)
}

type GoogleCalendarAPIHandler interface {
	InitiateOAuth(c *gin.Context)
	OAuthCallback(c *gin.Context)
	GetStatus(c *gin.Context)
	Disconnect(c *gin.Context)
	SyncFromGoogle(c *gin.Context)
	PushToGoogle(c *gin.Context)
}

type GoogleLoginAPIHandler interface {
	InitiateOAuth(c *gin.Context)
	OAuthCallback(c *gin.Context)
}
