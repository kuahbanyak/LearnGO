package ws

import (
	"log"
	"sync"

	"github.com/gorilla/websocket"
)

// Message types broadcast to clients
const (
	EventQueueUpdate    = "queue_update"
	EventNewAppointment = "new_appointment"
	EventCheckedIn      = "checked_in"
)

// BroadcastMessage is the envelope sent to all connected clients
type BroadcastMessage struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

// Client wraps a single WebSocket connection
type Client struct {
	Hub  *Hub
	Conn *websocket.Conn
	Send chan BroadcastMessage
}

// Hub maintains the set of active clients and broadcasts messages
type Hub struct {
	clients      map[*Client]bool
	BroadcastCh  chan BroadcastMessage
	Register     chan *Client
	Unregister   chan *Client
	mu           sync.RWMutex
}

// NewHub creates a new Hub instance
func NewHub() *Hub {
	return &Hub{
		clients:     make(map[*Client]bool),
		BroadcastCh: make(chan BroadcastMessage, 256),
		Register:    make(chan *Client),
		Unregister:  make(chan *Client),
	}
}

// Run starts the Hub event loop (call in a goroutine)
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			log.Printf("[WS] Client connected. Total: %d", len(h.clients))

		case client := <-h.Unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
			}
			h.mu.Unlock()
			log.Printf("[WS] Client disconnected. Total: %d", len(h.clients))

		case msg := <-h.BroadcastCh:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.Send <- msg:
				default:
					// Slow client — drop and disconnect
					close(client.Send)
					delete(h.clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// Broadcast sends a message to all connected WebSocket clients
func (h *Hub) Broadcast(eventType string, data interface{}) {
	h.BroadcastCh <- BroadcastMessage{Type: eventType, Data: data}
}

// ConnectedCount returns number of active connections
func (h *Hub) ConnectedCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}
