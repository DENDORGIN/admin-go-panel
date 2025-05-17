package sse

import (
	"github.com/google/uuid"
	"sync"
)

// Повідомлення для надсилання клієнтам
type SSEMessage struct {
	Event string
	Data  string
}

// Менеджер для підключень
type SSEManager struct {
	clients map[uuid.UUID]chan SSEMessage
	mutex   sync.RWMutex
}

var Manager = &SSEManager{
	clients: make(map[uuid.UUID]chan SSEMessage),
}

// Додати клієнта
func (m *SSEManager) AddClient(userID uuid.UUID, ch chan SSEMessage) {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	m.clients[userID] = ch
}

// Видалити клієнта
func (m *SSEManager) RemoveClient(userID uuid.UUID) {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	if ch, ok := m.clients[userID]; ok {
		close(ch)
		delete(m.clients, userID)
	}
}

// Надіслати повідомлення користувачу
func (m *SSEManager) SendToUser(userID uuid.UUID, msg SSEMessage) {
	m.mutex.RLock()
	defer m.mutex.RUnlock()
	if ch, ok := m.clients[userID]; ok {
		select {
		case ch <- msg:
		default:
			// Не блокуємо, якщо канал повний
		}
	}
}
