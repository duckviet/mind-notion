package main

import (
	"fmt"
	"log"
	"net/http"

	httphandler "github.com/duckviet/gin-collaborative-editor/backend/internal/delivery/http"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/repository"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/usecase/collaboration"
)

func main() {
	// Initialize repositories
	userRepo := repository.NewInMemoryUserRepository()
	docRepo := repository.NewInMemoryDocumentRepository()
	clientRepo := repository.NewInMemoryClientRepository()

	// Initialize collaboration service
	collaborationService := collaboration.NewCollaborationService(
		userRepo,
		docRepo,
		clientRepo,
	)

	// Initialize HTTP handlers
	wsHandler := httphandler.NewWebSocketHandler(collaborationService)

	// Setup routes
	http.HandleFunc("/ws", wsHandler.HandleConnections)

	// Start server
	fmt.Println("🚀 Collaborative Editor Server starting on :8080")
	fmt.Println("📡 WebSocket endpoint: ws://localhost:8080/ws")
	
	log.Fatal(http.ListenAndServe(":8080", nil))
}
