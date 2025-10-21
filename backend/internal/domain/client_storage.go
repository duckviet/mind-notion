package domain

import (
	"fmt"
	"sync"

	"github.com/gorilla/websocket"
)

// InMemoryClientRepository implements ClientRepository using in-memory storage
type InMemoryClientRepository struct {
	clients map[*websocket.Conn]*Client
	mu      sync.RWMutex
}

// NewInMemoryClientRepository creates a new in-memory client repository
func NewInMemoryClientRepository() *InMemoryClientRepository {
	return &InMemoryClientRepository{
		clients: make(map[*websocket.Conn]*Client),
	}
}

// Add adds a new client
func (r *InMemoryClientRepository) Add(client *Client) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.clients[client.Conn] = client
}

// Remove removes a client by connection
func (r *InMemoryClientRepository) Remove(conn *websocket.Conn) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.clients, conn)
}

// Get retrieves a client by connection
func (r *InMemoryClientRepository) Get(conn *websocket.Conn) (*Client, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	client, exists := r.clients[conn]
	if !exists {
		return nil, fmt.Errorf("client not found")
	}
	return client, nil
}

// GetAll returns all clients
func (r *InMemoryClientRepository) GetAll() []*Client {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	clients := make([]*Client, 0, len(r.clients))
	for _, client := range r.clients {
		clients = append(clients, client)
	}
	return clients
}

// GetByUserID retrieves a client by user ID
func (r *InMemoryClientRepository) GetByUserID(userID string) (*Client, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	for _, client := range r.clients {
		if client.User.ID == userID {
			return client, nil
		}
	}
	return nil, fmt.Errorf("client not found for user: %d", userID)
}
