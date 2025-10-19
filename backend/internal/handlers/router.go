// internal/handlers/router.go
package handlers

import (
	"fmt"
	"net/http"

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
) *gin.Engine {

	// 1. Khởi tạo Gin Engine và thiết lập mode
	gin.SetMode(cfg.Server.Mode)
	router := gin.Default()

	// 2. Thiết lập các Middleware toàn cục
	router.Use(corsMiddleware())
	router.Use(loggingMiddleware())
	// router.Use(authMiddleware()) // Bạn sẽ thêm middleware xác thực ở đây

	// 3. Thiết lập các Route không thuộc API spec
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "OK"})
	})
	router.GET("/ws", func(c *gin.Context) {
		// Logic của WebSocket handler
	})

	// 4. Tạo struct `ApiHandleFunctions` mà `routers.gen.go` yêu cầu
	// và "tiêm" các handler bạn vừa tạo vào đó.
	apiHandlers := ApiHandleFunctions{
		AuthAPI:   AuthAPI{authService},
		UserAPI:   UserAPI{userService},
		NoteAPI:   NoteAPI{noteService},
		FolderAPI: FolderAPI{folderService},
	}

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