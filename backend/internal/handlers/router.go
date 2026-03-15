// internal/handlers/router.go
package handlers

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/config"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/service"
	"github.com/gin-gonic/gin"
)

// Public paths that don't require authentication (exact match)
var publicExactPaths = []string{
	"/health",
	"/ws",
	"/api/v1/auth/login",
	"/api/v1/auth/register",
	"/api/v1/auth/logout",
	"/api/v1/auth/check",
	"/api/v1/auth/refresh-token",
	"/api/v1/auth/google/calendar/callback",
	"/api/v1/auth/google/login",
	"/api/v1/auth/google/login/callback",
}

// Prefix-matched public paths
var publicPrefixPaths = []string{
	"/api/v1/public/notes",
	"/api/v1/public/collab",
	"/internal/v1/ai",
}

// SetupRouter initializes and configures the Gin server
func SetupRouter(
	cfg *config.Config,
	authService service.AuthService,
	userService service.UserService,
	noteService service.NoteService,
	folderService service.FolderService,
	templateService service.TemplateService,
	eventService service.EventService,
	mediaService service.MediaService,
	commentService service.CommentService,
	aiRunAPI *AIRunAPI,
	aiInternalAPI *AIInternalAPI,
	wsHandler *WebSocketHandler,
	searchHandler *SearchHandler,
	googleCalendarAPI *GoogleCalendarAPI,
	googleLoginAPI *GoogleLoginAPI,
) *gin.Engine {
	gin.SetMode(cfg.Server.Mode)
	router := gin.Default()

	// Global middleware
	router.Use(corsMiddleware())
	router.Use(rateLimitMiddleware())
	router.Use(loggingMiddleware())
	router.Use(authMiddleware(authService))

	// Health check
	router.GET("/health", healthHandler)

	// WebSocket
	router.GET("/ws", func(c *gin.Context) {
		wsHandler.HandleConnections(c.Writer, c.Request)
	})

	// Search routes (if enabled)
	if searchHandler != nil {
		router.GET("/api/v1/notes/search", searchHandler.SearchNotes)
		router.POST("/api/v1/notes/reindex", searchHandler.ReindexAllNotes)
	}

	if aiInternalAPI != nil {
		router.POST("/internal/v1/ai/tools/execute", aiInternalAPI.ExecuteTool)
	}

	// Google Calendar routes
	if googleCalendarAPI != nil {
		router.GET("/api/v1/auth/google/calendar", googleCalendarAPI.InitiateOAuth)
		router.GET("/api/v1/auth/google/calendar/callback", googleCalendarAPI.OAuthCallback)
		router.GET("/api/v1/auth/google/calendar/status", googleCalendarAPI.GetStatus)
		router.DELETE("/api/v1/auth/google/calendar", googleCalendarAPI.Disconnect)
		router.POST("/api/v1/calendar/google/sync", googleCalendarAPI.SyncFromGoogle)
		router.POST("/api/v1/calendar/google/push/:id", googleCalendarAPI.PushToGoogle)
	}

	// Google Login routes
	if googleLoginAPI != nil {
		router.GET("/api/v1/auth/google/login", googleLoginAPI.InitiateOAuth)
		router.GET("/api/v1/auth/google/login/callback", googleLoginAPI.OAuthCallback)
	}

	// API handlers
	apiHandlers := ApiHandleFunctions{
		AIAPI:       *NewAIAPI(aiRunAPI),
		AuthAPI:     *NewAuthAPI(authService, cfg),
		UserAPI:     UserAPI{userService},
		NoteAPI:     NoteAPI{noteService: noteService, authService: authService},
		FolderAPI:   FolderAPI{folderService},
		TemplateAPI: TemplateAPI{templateService: templateService, authService: authService},
		EventAPI:    EventAPI{eventService: &eventService, authService: authService},
		MediaAPI:    *NewMediaAPI(mediaService),
		CommentAPI:  *NewCommentAPI(commentService),
		CollabAPI:   *NewCollabAPI(noteService, authService, cfg),
	}

	// Register generated routes
	NewRouterWithGinEngine(router, apiHandlers)

	return router
}

func healthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "OK"})
}

func corsMiddleware() gin.HandlerFunc {
	// 1. Lấy chuỗi từ Env và tách thành Slice
	originsEnv := os.Getenv("ALLOWED_ORIGINS")
	if originsEnv == "" {
		originsEnv = "http://localhost:3000" // Default cho dev
	}
	allowedOrigins := strings.Split(originsEnv, ",")

	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")

		// 2. Kiểm tra xem Origin có trong whitelist không
		isAllowed := false
		for _, o := range allowedOrigins {
			// Dùng strings.TrimSpace để tránh lỗi nếu lỡ tay gõ dấu cách sau dấu phẩy trong env
			if strings.TrimSpace(o) == origin {
				isAllowed = true
				break
			}
		}

		if isAllowed {
			c.Header("Access-Control-Allow-Origin", origin)
		}

		// Các header quan trọng khác
		c.Header("Vary", "Origin")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization, Accept, X-Requested-With, X-Edit-Token")

		// 3. Xử lý Preflight (Quan trọng!)
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

func loggingMiddleware() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(p gin.LogFormatterParams) string {
		return fmt.Sprintf("%s - [%s] \"%s %s %s %d %s \"%s\" %s\"\n",
			p.ClientIP,
			p.TimeStamp.Format("02/Jan/2006:15:04:05 -0700"),
			p.Method,
			p.Path,
			p.Request.Proto,
			p.StatusCode,
			p.Latency,
			p.Request.UserAgent(),
			p.ErrorMessage,
		)
	})
}

func authMiddleware(authService service.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		path := c.Request.URL.Path

		if isPublicPath(path) {
			log.Println("Public path: ", path)
			c.Next()
			return
		}
		log.Println("Not Public path: ", path)

		// Ưu tiên Authorization header, fallback sang HttpOnly cookie (access_token)
		token := extractTokenFromRequest(c)
		if token == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing or invalid token"})
			return
		}

		user, err := authService.ValidateToken(c.Request.Context(), token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}

		c.Set("user", user)
		c.Next()
	}
}

func isPublicPath(path string) bool {
	for _, p := range publicExactPaths {
		if path == p {
			return true
		}
	}

	for _, p := range publicPrefixPaths {
		if path == p || strings.HasPrefix(path, p+"/") {
			return true
		}
	}

	return false
}

func extractBearerToken(c *gin.Context) string {
	header := c.GetHeader("Authorization")
	if header == "" {
		return ""
	}
	return strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))
}
