package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"sync/atomic"

	"github.com/gorilla/websocket"
)

type Cursor struct {
	Index  int `json:"index"`
	Length int `json:"length"`
}

type User struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Color  string `json:"color"`
	Cursor Cursor `json:"cursor"`
}

type Message struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

type JoinPayload struct {
	Name string `json:"name"`
}

type CursorPayload struct {
	Index  int `json:"index"`
	Length int `json:"length"`
}

type DocUpdatePayload struct {
	Content string `json:"content"`
	Version int    `json:"version"`
}

type InitPayload struct {
	Self     User   `json:"self"`
	Users    []User `json:"users"`
	Content  string `json:"content"`
	Version  int    `json:"version"`
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type Client struct {
	Conn *websocket.Conn
	User User
}

var (
	clientsMu    sync.Mutex
	clients      = make(map[*websocket.Conn]*Client)
	docContent   string
	docVersion   int
	userSeq uint64
)

func nextUserID() string {
	seq := atomic.AddUint64(&userSeq, 1)
	return fmt.Sprintf("u-%d", seq)
}

func colorFor(seq uint64) string {
	palette := []string{
		"#e11d48", "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#14b8a6", "#ef4444",
	}
	return palette[int(seq)%len(palette)]
}

func writeJSON(conn *websocket.Conn, v any) error {
	data, err := json.Marshal(v)
	if err != nil {
		return err
	}
	return conn.WriteMessage(websocket.TextMessage, data)
}

func broadcastJSON(v any, except *websocket.Conn) {
	clientsMu.Lock()
	defer clientsMu.Unlock()
	data, err := json.Marshal(v)
	if err != nil {
		log.Println("marshal broadcast:", err)
		return
	}
	for c := range clients {
		if c == except {
			continue
		}
		if err := c.WriteMessage(websocket.TextMessage, data); err != nil {
			log.Println("broadcast error:", err)
			c.Close()
			delete(clients, c)
		}
	}
}

func snapshotUsersLocked() []User {
	users := make([]User, 0, len(clients))
	for _, cl := range clients {
		users = append(users, cl.User)
	}
	return users
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("upgrade:", err)
		return
	}

	seq := atomic.AddUint64(&userSeq, 1)
	client := &Client{
		Conn: ws,
		User: User{
			ID:    fmt.Sprintf("u-%d", seq),
			Name:  fmt.Sprintf("User %d", seq),
			Color: colorFor(seq),
			Cursor: Cursor{Index: 0, Length: 0},
		},
	}

	clientsMu.Lock()
	clients[ws] = client
	initMsg := Message{
		Type: "init",
		Payload: mustMarshal(InitPayload{
			Self:    client.User,
			Users:   snapshotUsersLocked(),
			Content: docContent,
			Version: docVersion,
		}),
	}
	clientsMu.Unlock()

	if err := writeJSON(ws, initMsg); err != nil {
		log.Println("send init:", err)
		cleanupClient(ws)
		return
	}

	// Announce join
	broadcastJSON(Message{Type: "user_joined", Payload: mustMarshal(client.User)}, ws)

	defer func() {
		cleanupClient(ws)
		broadcastJSON(Message{Type: "user_left", Payload: mustMarshal(struct{ ID string `json:"id"` }{ID: client.User.ID})}, ws)
	}()

	for {
		_, msg, err := ws.ReadMessage()
		if err != nil {
			break
		}
		var envelope Message
		if err := json.Unmarshal(msg, &envelope); err != nil {
			log.Println("invalid message:", err)
			continue
		}
		switch envelope.Type {
		case "join":
			var p JoinPayload
			if err := json.Unmarshal(envelope.Payload, &p); err == nil {
				clientsMu.Lock()
				if p.Name != "" {
					client.User.Name = p.Name
				}
				clientsMu.Unlock()
				broadcastJSON(Message{Type: "user_updated", Payload: mustMarshal(client.User)}, ws)
			}
		case "cursor":
			var p CursorPayload
			if err := json.Unmarshal(envelope.Payload, &p); err == nil {
				clientsMu.Lock()
				client.User.Cursor = Cursor{Index: p.Index, Length: p.Length}
				updated := client.User
				clientsMu.Unlock()
				broadcastJSON(Message{Type: "cursor", Payload: mustMarshal(struct {
					ID     string `json:"id"`
					Cursor Cursor `json:"cursor"`
				}{ID: updated.ID, Cursor: updated.Cursor})}, ws)
			}
		case "doc_update":
			var p DocUpdatePayload
			if err := json.Unmarshal(envelope.Payload, &p); err == nil {
				clientsMu.Lock()
				if p.Version == docVersion {
					docContent = p.Content
					docVersion++
					newState := DocUpdatePayload{Content: docContent, Version: docVersion}
					clientsMu.Unlock()
					broadcastJSON(Message{Type: "doc_state", Payload: mustMarshal(newState)}, nil)
				} else {
					// Send authoritative state back to requester
					current := DocUpdatePayload{Content: docContent, Version: docVersion}
					clientsMu.Unlock()
					_ = writeJSON(ws, Message{Type: "doc_state", Payload: mustMarshal(current)})
				}
			}
		case "ping":
			_ = writeJSON(ws, Message{Type: "pong"})
		default:
			// ignore
		}
	}
}

func mustMarshal(v any) json.RawMessage {
	b, _ := json.Marshal(v)
	return b
}

func cleanupClient(ws *websocket.Conn) {
	clientsMu.Lock()
	defer clientsMu.Unlock()
	delete(clients, ws)
	ws.Close()
}

func main() {
	http.HandleFunc("/ws", handleConnections)

	fmt.Println("Server chạy tại :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
