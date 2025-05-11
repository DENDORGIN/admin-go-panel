package handlers

import (
	internal "backend/internal/services/utils"
	"backend/modules/chat/messages/repository"
	direct "backend/modules/direct/client"
	"backend/modules/direct/models"
	directRepoository "backend/modules/direct/repository"
	"backend/modules/direct/utils"
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
	//ctx.Set("id", userID) // якщо треба далі по коду

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

	if history, err := utils.LoadRecentDirectMessages(db, chatID, 30); err == nil {
		if historyData, err := json.Marshal(history); err == nil {
			err := conn.WriteMessage(websocket.TextMessage, historyData)
			if err != nil {
				return
			}
		}
	}

	for {
		var raw map[string]interface{}
		if err := conn.ReadJSON(&raw); err != nil {
			break
		}

		processDirectEvent(raw, userID, chatID, conn, db, client)
	}

}

func processDirectEvent(msg map[string]interface{}, userID, chatID uuid.UUID, conn *websocket.Conn, db *gorm.DB, sender *direct.Client) {
	switch msg["type"] {
	case "new_message":
		content, _ := msg["message"].(string)
		emoji := getString(msg, "reaction")

		//contentURL, _ := msg["content_url"].(string)

		message := models.DirectMessage{
			ID:       uuid.New(),
			ChatID:   chatID,
			SenderID: userID,
			Message:  content,
			Reaction: emoji,
			//ContentURL: contentURL,
			CreatedAt: time.Now(),
		}
		_ = db.Create(&message)

		out := map[string]interface{}{
			"type":    "new_message",
			"message": message,
		}
		direct.Manager.Broadcast(chatID, out, nil)

	case "edit_message":
		messageID, err := uuid.Parse(getString(msg, "id"))
		if err != nil {
			log.Println("❌ Invalid message ID")
			return
		}

		newText := getString(msg, "message")
		edited, err := directRepoository.EditMessageByID(db, messageID, userID, &models.EditMessage{Message: newText})
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
		messageID, err := uuid.Parse(getString(msg, "id"))
		if err != nil {
			log.Println("❌ Invalid message ID")
			return
		}

		err = directRepoository.DeleteMessageByID(db, messageID, userID)
		if err != nil {
			log.Println("❌ Delete failed:", err)
			return
		}

		payload := map[string]interface{}{
			"type": "message_deleted",
			"id":   messageID,
		}
		direct.Manager.Broadcast(chatID, payload, nil)

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
			"type":    "message_reaction_updated",
			"message": updated,
		}
		direct.Manager.Broadcast(chatID, payload, nil)

	case "load_more_messages":
		beforeID, _ := uuid.Parse(msg["before"].(string))
		limit := int(msg["limit"].(float64))

		messages, err := repository.GetMessagesPaginated(db, chatID, limit, &beforeID)
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
			"user_id": userID,
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
