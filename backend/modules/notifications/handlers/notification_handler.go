package handlers

import (
	"backend/internal/services/utils"
	"encoding/json"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
	"sync"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

type NotificationClient struct {
	UserID uuid.UUID
	Conn   *websocket.Conn
}

type NotificationMessage struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

type NotificationManager struct {
	clients map[uuid.UUID]*NotificationClient
	mutex   sync.RWMutex
}

var Manager = NotificationManager{
	clients: make(map[uuid.UUID]*NotificationClient),
}

func (m *NotificationManager) AddClient(userID uuid.UUID, client *NotificationClient) {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	m.clients[userID] = client
}

func (m *NotificationManager) RemoveClient(userID uuid.UUID) {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	delete(m.clients, userID)
}

func (m *NotificationManager) SendToUser(userID uuid.UUID, msg NotificationMessage) {
	m.mutex.RLock()
	defer m.mutex.RUnlock()
	if client, ok := m.clients[userID]; ok {
		data, err := json.Marshal(msg)
		if err != nil {
			log.Println("❌ Failed to marshal notification message:", err)
			return
		}
		err = client.Conn.WriteMessage(websocket.TextMessage, data)
		if err != nil {
			return
		}
	}
}

func NotificationWebSocketHandler(ctx *gin.Context) {

	token := ctx.Query("token")
	user, err := utils.ParseJWTToken(token)
	if err != nil {
		ctx.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
	if err != nil {
		log.Println("❌ WebSocket upgrade error:", err)
		return
	}

	client := &NotificationClient{
		UserID: user.ID,
		Conn:   conn,
	}

	Manager.AddClient(user.ID, client)
	defer func() {
		Manager.RemoveClient(user.ID)
		err := conn.Close()
		if err != nil {
			return
		}
		log.Println("❌ Notification WebSocket closed for user:", user.ID)
	}()

	log.Println("✅ Notification WebSocket connected for user:", user.ID)

	// Слухаємо, але не очікуємо вхідних повідомлень
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			break
		}
	}
}
