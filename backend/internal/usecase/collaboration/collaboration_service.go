package collaboration

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/domain"
	"github.com/gorilla/websocket"
)

// CollaborationServiceImpl implements CollaborationService
type CollaborationServiceImpl struct {
	userRepo     domain.UserRepository
	docRepo      domain.DocumentRepository
	clientRepo   domain.ClientRepository
	userUseCase  *UserUseCaseImpl
	docUseCase   *DocumentUseCaseImpl
}

// NewCollaborationService creates a new collaboration service
func NewCollaborationService(
	userRepo domain.UserRepository,
	docRepo domain.DocumentRepository,
	clientRepo domain.ClientRepository,
) *CollaborationServiceImpl {
	return &CollaborationServiceImpl{
		userRepo:    userRepo,
		docRepo:     docRepo,
		clientRepo:  clientRepo,
		userUseCase: NewUserUseCase(userRepo),
		docUseCase:  NewDocumentUseCase(docRepo),
	}
}

// HandleConnection handles a new WebSocket connection
func (s *CollaborationServiceImpl) HandleConnection(client *domain.Client) error {
	// Add client to repository
	s.clientRepo.Add(client)
	
	// Get current document
	doc, err := s.docUseCase.GetDocument()
	if err != nil {
		return fmt.Errorf("failed to get document: %w", err)
	}
	
	// Get all users
	users, err := s.userUseCase.GetAllUsers()
	if err != nil {
		return fmt.Errorf("failed to get users: %w", err)
	}
	
	// Convert to domain.User slice for init payload
	domainUsers := make([]domain.User, len(users))
	for i, user := range users {
		domainUsers[i] = *user
	}
	
	// Send init message
	initPayload := domain.InitPayload{
		Self:    *client.User,
		Users:   domainUsers,
		Content: doc.Content,
		Version: doc.Version,
	}
	
	initMsg := domain.Message{
		Type:    domain.MessageTypeInit,
		Payload: s.mustMarshal(initPayload),
	}
	
	if err := s.writeJSON(client.Conn, initMsg); err != nil {
		return fmt.Errorf("failed to send init message: %w", err)
	}
	
	// Broadcast user joined message
	userJoinedMsg := domain.Message{
		Type:    domain.MessageTypeUserJoined,
		Payload: s.mustMarshal(client.User),
	}
	
	return s.BroadcastMessage(&userJoinedMsg, client.Conn)
}

// BroadcastMessage broadcasts a message to all clients except the specified one
func (s *CollaborationServiceImpl) BroadcastMessage(message *domain.Message, except *websocket.Conn) error {
	data, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}
	
	clients := s.clientRepo.GetAll()
	for _, client := range clients {
		if client.Conn == except {
			continue
		}
		
		if err := client.Conn.WriteMessage(websocket.TextMessage, data); err != nil {
			log.Printf("broadcast error: %v", err)
			client.Conn.Close()
			s.clientRepo.Remove(client.Conn)
		}
	}
	
	return nil
}

// HandleMessage handles incoming WebSocket messages
func (s *CollaborationServiceImpl) HandleMessage(client *domain.Client, message *domain.Message) error {
	switch message.Type {
	case domain.MessageTypeJoin:
		return s.handleJoin(client, message.Payload)
	case domain.MessageTypeCursor:
		return s.handleCursor(client, message.Payload)
	case domain.MessageTypeDocUpdate:
		return s.handleDocUpdate(client, message.Payload)
	case domain.MessageTypePing:
		return s.handlePing(client)
	default:
		// Ignore unknown message types
		return nil
	}
}

// handleJoin handles join messages
func (s *CollaborationServiceImpl) handleJoin(client *domain.Client, payload json.RawMessage) error {
	var joinPayload domain.JoinPayload
	if err := json.Unmarshal(payload, &joinPayload); err != nil {
		return fmt.Errorf("failed to unmarshal join payload: %w", err)
	}
	
	if joinPayload.Name != "" {
		client.User.Name = joinPayload.Name
		if err := s.userUseCase.UpdateUser(client.User); err != nil {
			return fmt.Errorf("failed to update user: %w", err)
		}
	}
	
	// Broadcast user updated message
	userUpdatedMsg := domain.Message{
		Type:    domain.MessageTypeUserUpdated,
		Payload: s.mustMarshal(client.User),
	}
	
	return s.BroadcastMessage(&userUpdatedMsg, client.Conn)
}

// handleCursor handles cursor update messages
func (s *CollaborationServiceImpl) handleCursor(client *domain.Client, payload json.RawMessage) error {
	var cursorPayload domain.CursorPayload
	if err := json.Unmarshal(payload, &cursorPayload); err != nil {
		return fmt.Errorf("failed to unmarshal cursor payload: %w", err)
	}
	
	cursor := domain.Cursor{
		Index:  cursorPayload.Index,
		Length: cursorPayload.Length,
	}
	
	if err := s.userUseCase.UpdateCursor(client.User.ID, cursor); err != nil {
		return fmt.Errorf("failed to update cursor: %w", err)
	}
	
	// Broadcast cursor update
	cursorUpdateMsg := domain.Message{
		Type: domain.MessageTypeCursor,
		Payload: s.mustMarshal(domain.CursorUpdatePayload{
			ID:     client.User.ID,
			Cursor: cursor,
		}),
	}
	
	return s.BroadcastMessage(&cursorUpdateMsg, client.Conn)
}

// handleDocUpdate handles document update messages
func (s *CollaborationServiceImpl) handleDocUpdate(client *domain.Client, payload json.RawMessage) error {
	var docUpdatePayload domain.DocUpdatePayload
	if err := json.Unmarshal(payload, &docUpdatePayload); err != nil {
		return fmt.Errorf("failed to unmarshal doc update payload: %w", err)
	}
	
	update := &domain.DocumentUpdate{
		Content: docUpdatePayload.Content,
		Version: docUpdatePayload.Version,
	}
	
	// Try to update the document
	updatedDoc, err := s.docUseCase.UpdateDocument(update)
	if err != nil {
		// Version conflict - send current state back to requester
		currentDoc, getErr := s.docUseCase.GetDocument()
		if getErr != nil {
			return fmt.Errorf("failed to get current document: %w", getErr)
		}
		
		docStateMsg := domain.Message{
			Type: domain.MessageTypeDocState,
			Payload: s.mustMarshal(domain.DocUpdatePayload{
				Content: currentDoc.Content,
				Version: currentDoc.Version,
			}),
		}
		
		return s.writeJSON(client.Conn, docStateMsg)
	}
	
	// Broadcast document state to all clients
	docStateMsg := domain.Message{
		Type: domain.MessageTypeDocState,
		Payload: s.mustMarshal(domain.DocUpdatePayload{
			Content: updatedDoc.Content,
			Version: updatedDoc.Version,
		}),
	}
	
	return s.BroadcastMessage(&docStateMsg, nil)
}

// handlePing handles ping messages
func (s *CollaborationServiceImpl) handlePing(client *domain.Client) error {
	pongMsg := domain.Message{
		Type: domain.MessageTypePong,
	}
	
	return s.writeJSON(client.Conn, pongMsg)
}

// writeJSON writes a JSON message to a WebSocket connection
func (s *CollaborationServiceImpl) writeJSON(conn *websocket.Conn, v interface{}) error {
	data, err := json.Marshal(v)
	if err != nil {
		return err
	}
	return conn.WriteMessage(websocket.TextMessage, data)
}

// RemoveClient removes a client from the repository
func (s *CollaborationServiceImpl) RemoveClient(conn *websocket.Conn) {
	s.clientRepo.Remove(conn)
}

// GetUserUseCase returns the user use case
func (s *CollaborationServiceImpl) GetUserUseCase() *UserUseCaseImpl {
	return s.userUseCase
}

// mustMarshal marshals a value to JSON, panicking on error
func (s *CollaborationServiceImpl) mustMarshal(v interface{}) json.RawMessage {
	data, _ := json.Marshal(v)
	return data
}
