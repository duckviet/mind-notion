package utils

import (
	"encoding/json"
	"log"

	"github.com/gorilla/websocket"
)

// WriteJSON writes a JSON message to a WebSocket connection
func WriteJSON(conn *websocket.Conn, v interface{}) error {
	data, err := json.Marshal(v)
	if err != nil {
		return err
	}
	return conn.WriteMessage(websocket.TextMessage, data)
}

// BroadcastJSON broadcasts a JSON message to multiple WebSocket connections
func BroadcastJSON(conns []*websocket.Conn, v interface{}, except *websocket.Conn) error {
	data, err := json.Marshal(v)
	if err != nil {
		return err
	}

	for _, conn := range conns {
		if conn == except {
			continue
		}
		
		if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
			log.Printf("broadcast error: %v", err)
			conn.Close()
		}
	}

	return nil
}

// MustMarshal marshals a value to JSON, panicking on error
func MustMarshal(v interface{}) []byte {
	data, err := json.Marshal(v)
	if err != nil {
		panic(err)
	}
	return data
}
