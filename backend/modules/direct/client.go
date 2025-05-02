package direct

import (
	"backend/internal/entities"
	"encoding/json"
	"errors"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"gorm.io/gorm"
	"time"
)

type Client struct {
	ID   uuid.UUID
	Conn *websocket.Conn
	Send chan []byte
	Hub  *Hub
	DB   *gorm.DB
}

type IncomingMessage struct {
	To   uuid.UUID `json:"to"`
	Text string    `json:"text"`
}

type OutgoingMessage struct {
	From           uuid.UUID `json:"from"`
	To             uuid.UUID `json:"to"`
	Text           string    `json:"text"`
	ConversationID uuid.UUID `json:"conversation_id"`
	CreatedAt      time.Time `json:"created_at"`
}

func (c *Client) Read() {
	defer func() {
		c.Hub.Unregister <- c
		_ = c.Conn.Close()
	}()

	for {
		_, msg, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}

		var input IncomingMessage
		if err := json.Unmarshal(msg, &input); err != nil {
			continue
		}

		savedMessage, err := SaveMessage(c.DB, c.ID, input.To, input.Text)
		if err != nil {
			continue
		}

		outgoing := OutgoingMessage{
			From:           c.ID,
			To:             input.To,
			Text:           input.Text,
			ConversationID: savedMessage.ConversationID,
			CreatedAt:      savedMessage.CreatedAt,
		}
		data, _ := json.Marshal(outgoing)

		if receiver, ok := c.Hub.Clients[input.To]; ok {
			receiver.Send <- data
		}
	}
}

func (c *Client) Write() {
	defer c.Conn.Close()
	for {
		select {
		case msg, ok := <-c.Send:
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			c.Conn.WriteMessage(websocket.TextMessage, msg)
		}
	}
}

func SaveMessage(db *gorm.DB, fromID, toID uuid.UUID, text string) (*entities.DirectMessage, error) {
	var conversation entities.Conversations

	err := db.Where(
		"(user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)",
		fromID, toID, toID, fromID,
	).First(&conversation).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		conversation = entities.Conversations{
			User1ID: fromID,
			User2ID: toID,
		}
		db.Create(&conversation)
	}

	message := entities.DirectMessage{
		ConversationID: conversation.ID,
		SenderID:       fromID,
		Text:           text,
		Read:           false,
	}
	db.Create(&message)

	return &message, nil
}
