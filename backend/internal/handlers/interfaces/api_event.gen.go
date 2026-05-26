package interfaces

import "github.com/gin-gonic/gin"

type EventAPIHandler interface {
	CreateEvent(c *gin.Context)
	DeleteEvent(c *gin.Context)
	GetEventById(c *gin.Context)
	ListEvents(c *gin.Context)
	ListEventsByRange(c *gin.Context)
	UpdateEvent(c *gin.Context)
}
