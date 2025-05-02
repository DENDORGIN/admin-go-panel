package messages

import (
	utils2 "backend/internal/services/utils"
	messageDTO "backend/modules/chat/messages/models"
	messageRepository "backend/modules/chat/messages/repository"
	reactionDTO "backend/modules/reaction/models"
	"backend/modules/reaction/repository"
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
	ContentUrl []string  `json:"content_url"`
	FullName   string    `json:"full_name"`  // для broadcast
	Avatar     string    `json:"avatar"`     // для broadcast
	CreatedAt  string    `json:"created_at"` // ISO string з фронта
}

func HandleWebSocket(ctx *gin.Context) {
	// ⛔️ Витягуємо всі параметри, але нічого не пишемо в респонс!
	token := ctx.Query("token")
	roomIDStr := ctx.Query("room_id")

	user, err := utils2.ParseJWTToken(token)
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

	db, ok := utils2.GetDBFromContext(ctx)
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
	if history, err := messageRepository.GetMessagesPaginated(db, roomID, 30, nil); err == nil {
		if historyData, err := json.Marshal(history); err == nil {
			err := conn.WriteMessage(websocket.TextMessage, historyData)
			if err != nil {
				return
			}
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
			updatedMessages, err := messageRepository.GetMessagesPaginated(db, roomID, 30, nil)
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

		if raw["type"] == "load_more_messages" {
			limit := int(raw["limit"].(float64))
			beforeID, _ := uuid.Parse(raw["before"].(string))

			msgs, err := messageRepository.GetMessagesPaginated(db, roomID, limit, &beforeID)
			if err != nil {
				log.Println("❌ Error loading messages:", err)
				continue
			}

			payload := map[string]interface{}{
				"type":     "messages_batch",
				"messages": msgs,
			}

			if out, err := json.Marshal(payload); err == nil {
				conn.WriteMessage(websocket.TextMessage, out) // 🔁 тільки клієнту
			}
			continue
		}

		if raw["type"] == "add_reaction" {
			messageIDStr, _ := raw["message_id"].(string)
			emoji, _ := raw["emoji"].(string)

			messageID, err := uuid.Parse(messageIDStr)
			if err != nil {
				log.Println("❌ Невалідний message_id:", messageIDStr)
				continue
			}

			reactions, err := repository.ToggleReaction(db, reactionDTO.ReactionPayload{
				UserID:    user.ID,
				MessageID: messageID,
				Emoji:     emoji,
			})

			if err != nil {
				log.Println("❌ Помилка реакції:", err)
				continue
			}

			// Пакуємо та шлемо всім оновлені реакції
			reactionsPayload := map[string]interface{}{
				"type":       "message_reactions_updated",
				"message_id": messageID,
				"reactions":  reactions,
			}
			if out, err := json.Marshal(reactionsPayload); err == nil {
				broadcastMessage(roomID, out)
			}
			continue
		}

		if raw["type"] == "edit_message" {
			messageIDStr, _ := raw["id"].(string)
			newMessageText, _ := raw["message"].(string)

			messageID, err := uuid.Parse(messageIDStr)
			if err != nil {
				log.Println("❌ Не валідний ID повідомлення:", messageIDStr)
				continue
			}

			edited, err := messageRepository.EditMessageById(db, messageID, user.ID, &messageDTO.EditMessage{Message: newMessageText})
			if err != nil {
				log.Println("❌ Помилка при редагуванні повідомлення:", err)
				continue
			}

			// Відправляємо повністю оновлене повідомлення
			editedJSON, err := json.Marshal(map[string]interface{}{
				"type":    "message_edited",
				"message": edited, // повна структура Message
			})
			if err != nil {
				log.Println("❌ Помилка маршалінгу:", err)
				continue
			}

			broadcastMessage(roomID, editedJSON)
			continue
		}

		if raw["type"] == "delete_message" {
			messageIDStr, _ := raw["id"].(string)
			messageID, err := uuid.Parse(messageIDStr)
			if err != nil {
				log.Println("❌ Не валідний ID повідомлення:", messageIDStr)
				continue
			}

			err = messageRepository.DeleteMessageById(db, messageID, user.ID)
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

		if raw["type"] == "user_typing" {
			typingPayload := map[string]interface{}{
				"type":    "user_typing",
				"user_id": user.ID,
				"room_id": roomID,
			}

			if out, err := json.Marshal(typingPayload); err == nil {
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

		message := messageDTO.Messages{
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
