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
	// ⛔️ Витягуємо всі параметри, але нічого не пишемо в респонс!
	token := ctx.Query("token")
	roomIDStr := ctx.Query("room_id")

	user, err := utils.ParseJWTToken(token)
	if err != nil {
		log.Println("❌ Невалідний токен:", err)
		ctx.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	roomID, err := uuid.Parse(roomIDStr)
	if err != nil {
		log.Println("❌ Невалідний room_id:", err)
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}

	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		log.Println("❌ DB context відсутній")
		ctx.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// ✅ Тепер апгрейдимо WebSocket
	conn, err := upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
	if err != nil {
		log.Println("❌ Помилка апгрейду WS:", err)
		return
	}
	defer func(conn *websocket.Conn) {
		err = conn.Close()
		if err != nil {

		}
	}(conn)

	fmt.Printf("🔌 Користувач %s приєднався до кімнати %s\n", user.ID, roomID)

	// 🔐 Реєструємо клієнта
	mutex.Lock()
	if clients[roomID] == nil {
		clients[roomID] = make(map[*websocket.Conn]bool)
	}
	clients[roomID][conn] = true
	mutex.Unlock()

	// 📜 Надсилаємо історію
	if history, err := rooms.GetAllMessages(db, roomID); err == nil {
		if historyData, err := json.Marshal(history); err == nil {
			conn.WriteMessage(websocket.TextMessage, historyData)
		}
	}

	// 🔄 Обробка вхідних повідомлень
	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Println("🔌 Відключився користувач:", user.ID)
			mutex.Lock()
			delete(clients[roomID], conn)
			mutex.Unlock()
			break
		}

		var raw map[string]interface{}
		if err := json.Unmarshal(msg, &raw); err != nil {
			log.Println("❌ Невірний JSON:", err)
			continue
		}

		// 🔄 Оновлення повідомлення (наприклад, після завантаження файлів)
		if raw["type"] == "update_message" {
			messageIDStr, _ := raw["id"].(string)
			messageID, err := uuid.Parse(messageIDStr)
			if err != nil {
				log.Println("❌ Невалідний ID повідомлення:", messageIDStr)
				continue
			}

			// Після оновлення медіа
			updatedMessages, err := rooms.GetAllMessages(db, roomID)
			if err != nil {
				log.Println("❌ GetAllMessages error:", err)
				continue
			}
			for _, msg := range updatedMessages {
				if msg.ID == messageID.String() {
					if out, err := json.Marshal(msg); err == nil {
						broadcastMessage(roomID, out)
					}
					break
				}
			}

			continue
		}

		if raw["type"] == "delete_message" {
			messageIDStr, _ := raw["id"].(string)
			messageID, err := uuid.Parse(messageIDStr)
			if err != nil {
				log.Println("❌ Невалідний ID повідомлення:", messageIDStr)
				continue
			}

			err = rooms.DeleteMessageById(db, messageID, user.ID)
			if err != nil {
				log.Println("❌ Помилка при видаленні повідомлення:", err)
				continue
			}

			// 🛰 Сповіщаємо всіх клієнтів про видалення
			deletePayload := map[string]interface{}{
				"type": "message_deleted",
				"id":   messageID,
			}
			if out, err := json.Marshal(deletePayload); err == nil {
				broadcastMessage(roomID, out)
			}

			continue
		}

		// 📨 Створення нового повідомлення
		var payload MessagePayload
		if err := json.Unmarshal(msg, &payload); err != nil {
			log.Println("❌ Неможливо розпарсити повідомлення:", err)
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
