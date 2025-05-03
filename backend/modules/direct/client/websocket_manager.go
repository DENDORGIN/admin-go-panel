package direct

import (
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"sync"
)

type Client struct {
	UserID uuid.UUID
	ChatID uuid.UUID
	Conn   *websocket.Conn
}

type WebSocketManager struct {
	clients map[uuid.UUID][]*Client
	lock    sync.RWMutex
}

var Manager = &WebSocketManager{
	clients: make(map[uuid.UUID][]*Client),
}

func (m *WebSocketManager) AddClient(chatID uuid.UUID, client *Client) {
	m.lock.Lock()
	defer m.lock.Unlock()
	m.clients[chatID] = append(m.clients[chatID], client)
}

func (m *WebSocketManager) RemoveClient(chatID uuid.UUID, client *Client) {
	m.lock.Lock()
	defer m.lock.Unlock()

	clients := m.clients[chatID]
	for i, c := range clients {
		if c == client {
			m.clients[chatID] = append(clients[:i], clients[i+1:]...)
			break
		}
	}

	if len(m.clients[chatID]) == 0 {
		delete(m.clients, chatID)
	}
}

func (m *WebSocketManager) Broadcast(chatID uuid.UUID, message interface{}, exclude *Client) {
	m.lock.RLock()
	defer m.lock.RUnlock()

	for _, client := range m.clients[chatID] {
		if client != exclude {
			client.Conn.WriteJSON(message)
		}
	}
}
