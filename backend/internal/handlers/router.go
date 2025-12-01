// internal/handlers/router.go
package handlers

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/config"  // Thay thế bằng module của bạn
	"github.com/duckviet/gin-collaborative-editor/backend/internal/service" // Thay thế bằng module của bạn

	"github.com/gin-gonic/gin"
)

// SetupRouter là hàm khởi tạo và cấu hình toàn bộ Gin server.
// Nó là "điểm vào" duy nhất để thiết lập server.
func SetupRouter(
	cfg *config.Config,
	authService service.AuthService,
	userService service.UserService,
	noteService service.NoteService,
	folderService service.FolderService,
	wsHandler *WebSocketHandler,
	searchHandler *SearchHandler,
) *gin.Engine {

	// 1. Khởi tạo Gin Engine và thiết lập mode
	gin.SetMode(cfg.Server.Mode)
	router := gin.Default()

    // 2. Thiết lập các Middleware toàn cục
    router.Use(corsMiddleware())
    router.Use(loggingMiddleware())
    router.Use(authMiddleware(authService))

	// 3. Thiết lập các Route không thuộc API spec
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "OK"})
	})
	router.GET("/ws", func(c *gin.Context) {
		wsHandler.HandleConnections(c.Writer, c.Request)
	})

	// 3.1. Search routes (semantic search with Pinecone)
	if searchHandler != nil {
		router.GET("/api/v1/notes/search", searchHandler.SearchNotes)
		router.POST("/api/v1/notes/reindex", searchHandler.ReindexAllNotes)
	}

	// 4. Tạo struct `ApiHandleFunctions` mà `routers.gen.go` yêu cầu
	// và "tiêm" các handler bạn vừa tạo vào đó.
	apiHandlers := ApiHandleFunctions{
		AuthAPI:   AuthAPI{authService},
		UserAPI:   UserAPI{userService},
		NoteAPI:   NoteAPI{noteService: noteService, authService: authService},
		FolderAPI: FolderAPI{folderService},
	}

	// 4.1. Backwards-compatible short auth routes without the `/api/v1` prefix.
	// The frontend is calling `/auth/*`, so we expose thin wrappers that
	// delegate to the same AuthAPI handlers used by the generated routes.
	router.POST("/auth/login", apiHandlers.AuthAPI.Login)
	router.POST("/auth/logout", apiHandlers.AuthAPI.Logout)
	router.POST("/auth/register", apiHandlers.AuthAPI.Register)
	router.GET("/auth/check", apiHandlers.AuthAPI.CheckAuth)

	// 5. GỌI HÀM TỪ FILE AUTO-GEN ĐỂ ĐĂNG KÝ TẤT CẢ API ROUTES
	// Đây chính là điểm kết nối quan trọng nhất!
	// Nó lấy router đã được cấu hình middleware và thêm các route API vào.
	NewRouterWithGinEngine(router, apiHandlers)

	// 7. Trả về router đã được cấu hình hoàn chỉnh
	return router
}

// corsMiddleware sets up CORS headers
func corsMiddleware() gin.HandlerFunc {
	// (Giữ nguyên code của bạn)
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

// loggingMiddleware logs HTTP requests
func loggingMiddleware() gin.HandlerFunc {
	// (Giữ nguyên code của bạn)
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return fmt.Sprintf("%s - [%s] \"%s %s %s %d %s \"%s\" %s\"\n",
			param.ClientIP,
			param.TimeStamp.Format("02/Jan/2006:15:04:05 -0700"),
			param.Method,
			param.Path,
			param.Request.Proto,
			param.StatusCode,
			param.Latency,
			param.Request.UserAgent(),
			param.ErrorMessage,
		)
	})
}

// authMiddleware validates Bearer tokens and injects the user into context.
// Skips public endpoints like /health, /ws, and /api/v1/auth/*
func authMiddleware(authService service.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		path := c.Request.URL.Path
		// Allowlist public paths
		if path == "/health" ||
			strings.HasPrefix(path, "/ws") ||
			strings.HasPrefix(path, "/api/v1/auth/") ||
			strings.HasPrefix(path, "/auth/") {
			c.Next()
			return
		}

		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing Authorization header"})
			return
		}
		token := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
		if token == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
			return
		}

		user, err := authService.ValidateToken(c.Request.Context(), token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}

		// Attach user to context
		c.Set("user", user)
		c.Next()
	}
}