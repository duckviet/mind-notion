// internal/handlers/router.go
package handlers

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/config"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/service"
	"github.com/gin-gonic/gin"
)

// Public paths that don't require authentication
var publicPaths = []string{
	"/health",
	"/ws",
	"/api/v1/auth",
	"/auth",
}

// SetupRouter initializes and configures the Gin server
func SetupRouter(
	cfg *config.Config,
	authService service.AuthService,
	userService service.UserService,
	noteService service.NoteService,
	folderService service.FolderService,
	wsHandler *WebSocketHandler,
	searchHandler *SearchHandler,
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

	// API handlers
	apiHandlers := ApiHandleFunctions{
		AuthAPI:   *NewAuthAPI(authService, cfg),
		UserAPI:   UserAPI{userService},
		NoteAPI:   NoteAPI{noteService: noteService, authService: authService},
		FolderAPI: FolderAPI{folderService},
	}
	
	// Register generated routes
	NewRouterWithGinEngine(router, apiHandlers)

	return router
}

func healthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "OK"})
}

func corsMiddleware() gin.HandlerFunc {
	productOrigin := os.Getenv("FRONTEND_ORIGIN")

	allowedOrigins := []string{
		"http://localhost:3000",      // Local Dev
		productOrigin,        // Production 
	}
	return func(c *gin.Context) {
		// In a real deployment, this should come from config (env / config file)
		origin := c.GetHeader("Origin")
		
		// 3. Kiểm tra xem Origin này có nằm trong Whitelist không
		isAllowed := false
		for _, o := range allowedOrigins {
			if o == origin {
				isAllowed = true
				break
			}
		}

		// 4. Nếu hợp lệ, set Origin đó vào Header
		if isAllowed {
			c.Header("Access-Control-Allow-Origin", origin)
		}
		
		c.Header("Vary", "Origin")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")

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
			c.Next()
			return
		}

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
	for _, p := range publicPaths {
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