package chat

import (
	"backend/internal/adminpanel/db/postgres"
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
	ChatId  uuid.UUID `json:"chat_id"`
	UserId  uuid.UUID `json:"user_id"`
	Message string    `json:"message"`
}

func HandleWebSocket(c *gin.Context) {
	token := c.Query("token")
	_, err := utils.VerifyResetToken(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}
	chatID, err := uuid.Parse(c.Query("chat_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid chat_id"})
		return
	}

	user, err := utils.ParseJWTToken(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	fmt.Printf("Клієнт з ID %s підключився\n", user.ID)

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		fmt.Println("Помилка WebSocket:", err)
		return
	}
	defer func(conn *websocket.Conn) {
		err := conn.Close()
		if err != nil {

		}
	}(conn)

	mutex.Lock()
	if clients[chatID] == nil {
		clients[chatID] = make(map[*websocket.Conn]bool)
	}
	clients[chatID][conn] = true
	mutex.Unlock()

	// Очікуємо повідомлення
	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Println("Користувач відключився:", user.ID)
			mutex.Lock()
			delete(clients[chatID], conn)
			mutex.Unlock()
			break
		}

		// Обробка повідомлення
		var payload MessagePayload
		if err := json.Unmarshal(msg, &payload); err != nil {
			log.Println("Помилка JSON:", err)
			continue
		}

		// Зберігаємо в базу
		message := entities.Messages{
			ID:        uuid.New(),
			UserId:    user.ID,
			ChatId:    chatID,
			Message:   payload.Message,
			CreatedAt: time.Now(),
		}
		postgres.DB.Create(&message)

		// Відправляємо всім у кімнаті
		broadcastMessage(chatID, msg)
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

//func main() {
//	r := gin.Default()
//	r.GET("/ws", handleWebSocket)
//
//	r.Run(":8080")
//}
