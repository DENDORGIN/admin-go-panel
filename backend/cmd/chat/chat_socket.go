package chat

import (
	"backend/cmd/chat/rooms"
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/services/utils"
	"encoding/json"
	"fmt"
	"github.com/google/uuid"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// Підключені клієнти {chatID: [WebSocket-з'єднання]}
var clients = make(map[uuid.UUID]map[*websocket.Conn]bool)
var mutex = sync.Mutex{}

// Оновлювач WebSocket-з'єднання
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type MessagePayload struct {
	ID         uuid.UUID `json:"id"`
	RoomId     uuid.UUID `json:"room_id"`
	UserId     uuid.UUID `json:"user_id"`
	Message    string    `json:"message"`
	ContentUrl []string  `json:"content_url"` // нове поле
	FullName   string    `json:"full_name"`   // для broadcast
	Avatar     string    `json:"avatar"`      // для broadcast
	CreatedAt  string    `json:"created_at"`  // ISO string з фронта
}

func HandleWebSocket(ctx *gin.Context) {
	token := ctx.Query("token")
	_, err := utils.VerifyResetToken(token)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		return
	}

	roomID, err := uuid.Parse(ctx.Query("room_id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid room_id"})
		return
	}

	user, err := utils.ParseJWTToken(token)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	fmt.Printf("Клієнт з ID %s підключився до кімнати %s\n", user.ID, roomID)

	conn, err := upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
	if err != nil {
		fmt.Println("Помилка WebSocket:", err)
		return
	}
	defer conn.Close()

	mutex.Lock()
	if clients[roomID] == nil {
		clients[roomID] = make(map[*websocket.Conn]bool)
	}
	clients[roomID][conn] = true
	mutex.Unlock()

	history, err := rooms.GetAllMessages(db, roomID)
	if err != nil {
		log.Println("❌ Не вдалося отримати історію чату:", err)
	} else {
		historyData, _ := json.Marshal(history)
		conn.WriteMessage(websocket.TextMessage, historyData)
	}

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Println("Користувач відключився:", user.ID)
			mutex.Lock()
			delete(clients[roomID], conn)
			mutex.Unlock()
			break
		}

		// Розпарсимо як raw JSON
		var raw map[string]interface{}
		if err := json.Unmarshal(msg, &raw); err != nil {
			log.Println("❌ JSON помилка:", err)
			continue
		}

		if raw["type"] == "update_message" {
			messageIDStr, _ := raw["id"].(string)
			messageID, err := uuid.Parse(messageIDStr)
			if err != nil {
				log.Println("❌ Невалідний ID:", messageIDStr)
				continue
			}

			// ✅ Отримуємо оновлене повідомлення з медіа
			allMessages, err := rooms.GetAllMessages(db, roomID)
			if err != nil {
				log.Println("❌ GetAllMessages помилка:", err)
				continue
			}

			for _, msg := range allMessages {
				if msg.ID == messageID.String() {
					// 🔄 Повністю оновлене повідомлення (із content_url із таблиці media)
					out, _ := json.Marshal(msg)
					broadcastMessage(roomID, out)
					break
				}
			}

			continue
		}

		// 📨 Звичайне повідомлення
		var payload MessagePayload
		if err := json.Unmarshal(msg, &payload); err != nil {
			log.Println("❌ Payload decode error:", err)
			continue
		}

		message := entities.Messages{
			ID:        payload.ID,
			UserId:    user.ID,
			RoomId:    roomID,
			Message:   payload.Message,
			CreatedAt: time.Now(),
		}
		db.Create(&message)

		broadcastMessage(roomID, msg)
	}
}

// Функція для розсилки повідомлень
func broadcastMessage(chatID uuid.UUID, message []byte) {
	mutex.Lock()
	defer mutex.Unlock()
	for client := range clients[chatID] {
		err := client.WriteMessage(websocket.TextMessage, message)
		if err != nil {
			client.Close()
			delete(clients[chatID], client)
		}
	}
}
