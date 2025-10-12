package domain

import "encoding/json"

// MessageType represents the type of WebSocket message
type MessageType string

const (
	MessageTypeInit      MessageType = "init"
	MessageTypeJoin      MessageType = "join"
	MessageTypeCursor    MessageType = "cursor"
	MessageTypeDocUpdate MessageType = "doc_update"
	MessageTypeDocState  MessageType = "doc_state"
	MessageTypeUserJoined MessageType = "user_joined"
	MessageTypeUserLeft   MessageType = "user_left"
	MessageTypeUserUpdated MessageType = "user_updated"
	MessageTypePing      MessageType = "ping"
	MessageTypePong      MessageType = "pong"
)

// Message represents a WebSocket message envelope
type Message struct {
	Type    MessageType     `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

// JoinPayload represents the payload for join message
type JoinPayload struct {
	Name string `json:"name"`
}

// CursorPayload represents the payload for cursor message
type CursorPayload struct {
	Index  int `json:"index"`
	Length int `json:"length"`
}

// DocUpdatePayload represents the payload for document update
type DocUpdatePayload struct {
	Content string `json:"content"`
	Version int    `json:"version"`
}

// InitPayload represents the payload for initialization message
type InitPayload struct {
	Self    User   `json:"self"`
	Users   []User `json:"users"`
	Content string `json:"content"`
	Version int    `json:"version"`
}

// UserLeftPayload represents the payload for user left message
type UserLeftPayload struct {
	ID string `json:"id"`
}

// CursorUpdatePayload represents the payload for cursor update
type CursorUpdatePayload struct {
	ID     string `json:"id"`
	Cursor Cursor `json:"cursor"`
}
