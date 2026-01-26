package domain

import (
	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
	"github.com/gorilla/websocket"
)

// Client represents a WebSocket client connection
type Client struct {
	Conn *websocket.Conn
	User *models.User
	NoteID string
}

// ClientRepository defines the interface for client management
type ClientRepository interface {
	Add(client *Client)
	Remove(conn *websocket.Conn)
	Get(conn *websocket.Conn) (*Client, error)
	GetAll() []*Client
	GetByUserID(userID string) (*Client, error)
}

// CollaborationService defines the interface for collaboration features
type CollaborationService interface {
	HandleConnection(client *Client) error
	BroadcastMessage(message *Message, except *websocket.Conn) error
	HandleMessage(client *Client, message *Message) error
}
