package handlers

import (
	internal "backend/internal/services/utils"
	direct "backend/modules/direct/client"
	"backend/modules/direct/models"
	directRepoository "backend/modules/direct/repository"
	notificationService "backend/modules/notifications/service"
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"gorm.io/gorm"
	"log"
	"net/http"
	"time"
)

var wsUpgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

func DirectChatWebSocket(ctx *gin.Context) {
	db, ok := internal.GetDBFromContext(ctx)
	if !ok {
		ctx.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	token := ctx.Query("token")
	user, err := internal.ParseJWTToken(token)
	if err != nil {
		log.Println("❌ Невалідний токен:", err)
		ctx.AbortWithStatus(http.StatusUnauthorized)
		return
	}
	fmt.Println("token:", token)
	fmt.Println("user:", user)

	userID := user.ID

	chatID, err := uuid.Parse(ctx.Param("chatId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid chat ID"})
		return
	}

	conn, err := wsUpgrader.Upgrade(ctx.Writer, ctx.Request, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}
	defer func(conn *websocket.Conn) {
		err := conn.Close()
		if err != nil {

		}
	}(conn)

	client := &direct.Client{
		UserID: userID,
		ChatID: chatID,
		Conn:   conn,
	}

	direct.Manager.AddClient(chatID, client)
	defer direct.Manager.RemoveClient(chatID, client)

	log.Printf("✅ WebSocket connected user %s chat %s\n", userID, chatID)

	if history, err := directRepoository.GetDirectMessagesPaginated(db, chatID, userID, 30, nil); err == nil {
		if historyData, err := json.Marshal(history); err == nil {
			_ = conn.WriteMessage(websocket.TextMessage, historyData)

			// ✅ Відмічаємо останні повідомлення як прочитані
			go func() {
				if err := directRepoository.MarkRecentMessagesAsRead(db, chatID, userID, 20); err != nil {
					log.Println("❌ Mark as read error:", err)
				}
			}()
		}
	}

	for {
		var raw map[string]interface{}
		if err := conn.ReadJSON(&raw); err != nil {
			break
		}

		processDirectEvent(raw, userID, chatID, userID, user.FullName, conn, db, client)
	}

}

func processDirectEvent(msg map[string]interface{}, SenderID, chatID, userID uuid.UUID, fullName string, conn *websocket.Conn, db *gorm.DB, sender *direct.Client) {
	switch msg["type"] {
	case "new_message":
		content, _ := msg["message"].(string)
		emoji := getString(msg, "reaction")

		//ContentURL, _ := msg["ContentUrl"].(string)

		message := models.DirectMessage{
			ID:       uuid.New(),
			ChatID:   chatID,
			SenderID: SenderID,
			Message:  content,
			Reaction: emoji,
			IsRead:   false,
			//ContentURL: []string{ContentURL},
			CreatedAt: time.Now(),
		}
		_ = db.Create(&message)

		out := map[string]interface{}{
			"type":    "new_message",
			"message": message,
		}
		direct.Manager.Broadcast(chatID, out, nil)

		// Знаходимо одержувача
		receiverID, err := directRepoository.GetOtherParticipantID(db, chatID, SenderID)
		if err != nil {
			log.Println("❌ Не вдалося знайти іншого учасника чату:", err)
			return
		}

		// Відправляємо сповіщення через глобальний сокет
		go notificationService.SendNotification(receiverID, notificationService.NotificationPayload{
			Title:  fullName,
			Body:   message.Message,
			Type:   "chat",
			Meta:   map[string]any{"chat_id": chatID},
			SentAt: time.Now(),
		})

	case "edit_message":
		messageID, err := uuid.Parse(getString(msg, "ID"))
		if err != nil {
			log.Println("❌ Invalid message ID")
			return
		}

		newText := getString(msg, "message")
		edited, err := directRepoository.EditMessageByID(db, messageID, SenderID, &models.EditMessage{Message: newText})
		if err != nil {
			log.Println("❌ Edit failed:", err)
			return
		}

		payload := map[string]interface{}{
			"type":    "message_edited",
			"message": edited,
		}
		direct.Manager.Broadcast(chatID, payload, nil)

	case "delete_message":
		messageID, err := uuid.Parse(getString(msg, "ID"))
		if err != nil {
			log.Println("❌ Invalid message ID")
			return
		}

		err = directRepoository.DeleteMessageByID(db, messageID, SenderID)
		if err != nil {
			log.Println("❌ Delete failed:", err)
			return
		}

		payload := map[string]interface{}{
			"type": "message_deleted",
			"ID":   messageID,
		}
		direct.Manager.Broadcast(chatID, payload, nil)
		log.Println("✅ Message deleted:", messageID)

	case "add_reaction":
		messageID, err := uuid.Parse(getString(msg, "message_id"))
		if err != nil {
			log.Println("❌ Invalid message_id")
			return
		}
		emoji := getString(msg, "reaction")

		updated, err := directRepoository.AddEmojiToMessage(db, messageID, &models.Reaction{Reaction: emoji})
		if err != nil {
			log.Println("❌ Reaction update error:", err)
			return
		}

		payload := map[string]interface{}{
			"type":    "message_reactions_updated",
			"message": updated,
		}
		direct.Manager.Broadcast(chatID, payload, nil)

	case "update_message":
		messageID, err := uuid.Parse(getString(msg, "ID"))
		if err != nil {
			log.Println("❌ Invalid message ID", messageID)
			return
		}
		updatedMessages, err := directRepoository.GetDirectMessagesPaginated(db, chatID, userID, 30, nil)
		if err != nil {
			log.Println("❌ Error fetching messages:", err)
			return
		}
		payload := map[string]interface{}{
			"type":    "update_message",
			"message": updatedMessages,
		}
		direct.Manager.Broadcast(chatID, payload, nil)

	case "message_read":
		messageID, err := uuid.Parse(getString(msg, "message_id"))
		if err != nil {
			log.Println("❌ Invalid message_id")
			return
		}

		// просто оновлюємо поле
		err = db.Model(&models.DirectMessage{}).
			Where("id = ?", messageID).
			Update("is_read", true).Error

		if err != nil {
			log.Println("❌ Update is_read error:", err)
		}
		payload := map[string]interface{}{
			"type":       "message_read_update",
			"message_id": messageID,
			"reader_id":  SenderID, // можна не використовувати
		}
		direct.Manager.Broadcast(chatID, payload, sender) // ❗ не sender

	case "load_more_messages":
		beforeID, _ := uuid.Parse(msg["before"].(string))
		limit := int(msg["limit"].(float64))

		messages, err := directRepoository.GetDirectMessagesPaginated(db, chatID, userID, limit, &beforeID) // &beforeID
		if err == nil {
			err := conn.WriteJSON(map[string]interface{}{
				"type":     "messages_batch",
				"messages": messages,
			})
			if err != nil {
				return
			}
		}

	case "user_typing":
		typingPayload := map[string]interface{}{
			"type":    "user_typing",
			"user_id": SenderID,
			"chat_id": chatID,
		}
		direct.Manager.Broadcast(chatID, typingPayload, sender)
	}
}

func getString(m map[string]interface{}, key string) string {
	if val, ok := m[key]; ok {
		if s, ok := val.(string); ok {
			return s
		}
	}
	return ""
}
