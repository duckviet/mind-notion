package handlers

import (
	"net/http"

	dbmodels "github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/handlers/interfaces"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/service"
	"github.com/gin-gonic/gin"
)

type UserAPI struct {
	userService service.UserService
} 

var _ interfaces.UserAPIHandler = (*UserAPI)(nil)

func NewUserAPI(userService service.UserService) *UserAPI {
	return &UserAPI{
		userService: userService,
	}
}
 
func (api *UserAPI) DeleteMe(c *gin.Context) {
	c.JSON(200, gin.H{"status": "OK"})
}

func (api *UserAPI) GetMe(c *gin.Context) {
	userVal, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	u := userVal.(*dbmodels.User)

	c.JSON(200, gin.H{
		"id":             u.ID,
		"username":       u.Username,
		"email":          u.Email,
		"name":           u.Name,
		"avatar":         u.Avatar,
		"avatar_url":     u.Avatar,
		"status":         u.Status,
		"email_verified": u.EmailVerified,
		"created_at":     u.CreatedAt,
		"updated_at":     u.UpdatedAt,
	})
}

func (api *UserAPI) UpdateMe(c *gin.Context) {
	c.JSON(200, gin.H{"status": "OK"})
}