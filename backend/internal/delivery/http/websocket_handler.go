package http

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/domain"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/usecase/collaboration"
	"github.com/gorilla/websocket"
)

// WebSocketHandler handles WebSocket connections
type WebSocketHandler struct {
	collaborationService *collaboration.CollaborationServiceImpl
	upgrader            websocket.Upgrader
}

// NewWebSocketHandler creates a new WebSocket handler
func NewWebSocketHandler(collaborationService *collaboration.CollaborationServiceImpl) *WebSocketHandler {
	return &WebSocketHandler{
		collaborationService: collaborationService,
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true // Allow all origins for development
			},
		},
	}
}

// HandleConnections handles WebSocket connections
func (h *WebSocketHandler) HandleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer h.cleanupClient(ws)

	log.Printf("URL: %v", (r.URL))
	// Get user ID from query parameter or create new user
	userID := r.URL.Query().Get("user_id")
	var user *domain.User

	if userID != "" {
		// Try to get existing user
		user, err = h.collaborationService.GetUserUseCase().GetUser(userID)
		if err != nil {
			log.Printf("User not found, creating new user: %v", err)
			user, err = h.collaborationService.GetUserUseCase().CreateUser("")
		}
	} else {
		// Create new user
		user, err = h.collaborationService.GetUserUseCase().CreateUser("")
	}

	log.Printf("User connected: %+v", user)

	if err != nil {
		log.Printf("Failed to create/get user: %v", err)
		return
	}

	// Create client
	client := &domain.Client{
		Conn: ws,
		User: user,
	}

	// Handle the connection
	if err := h.collaborationService.HandleConnection(client); err != nil {
		log.Printf("Failed to handle connection: %v", err)
		return
	}

	// Handle incoming messages
	for {
		_, msg, err := ws.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		var envelope domain.Message
		if err := json.Unmarshal(msg, &envelope); err != nil {
			log.Printf("Invalid message format: %v", err)
			continue
		}

		if err := h.collaborationService.HandleMessage(client, &envelope); err != nil {
			log.Printf("Failed to handle message: %v", err)
		}
	}

	// Broadcast user left message
	userLeftMsg := domain.Message{
		Type: domain.MessageTypeUserLeft,
		Payload: h.mustMarshal(domain.UserLeftPayload{
			ID: client.User.ID,
		}),
	}

	if err := h.collaborationService.BroadcastMessage(&userLeftMsg, ws); err != nil {
		log.Printf("Failed to broadcast user left message: %v", err)
	}
}

// cleanupClient removes a client from the repository and closes the connection
func (h *WebSocketHandler) cleanupClient(ws *websocket.Conn) {
	h.collaborationService.RemoveClient(ws)
	ws.Close()
}

// mustMarshal marshals a value to JSON, panicking on error
func (h *WebSocketHandler) mustMarshal(v interface{}) json.RawMessage {
	data, _ := json.Marshal(v)
	return data
}
