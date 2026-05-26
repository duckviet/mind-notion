package interfaces

import "github.com/gin-gonic/gin"

type AuthAPIHandler interface {
	CheckAuth(c *gin.Context)
	Login(c *gin.Context)
	Logout(c *gin.Context)
	RefreshToken(c *gin.Context)
	Register(c *gin.Context)
}
