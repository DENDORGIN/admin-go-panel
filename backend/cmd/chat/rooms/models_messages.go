package rooms

import (
	"backend/internal/adminpanel/db/postgres"
	"backend/internal/adminpanel/entities"
	"github.com/google/uuid"
)

type Message struct {
	ID        string `json:"id"`
	UserID    string `json:"user_id"`
	RoomID    string `json:"room_id"`
	Message   string `json:"message"`
	CreatedAt string `json:"created_at"`
}

func GetAllMessages(roomId uuid.UUID) ([]Message, error) {
	var messages []entities.Messages
	var response []Message

	err := postgres.DB.Where("room_id = ?", roomId).Order("created_at ASC").Find(&messages).Error
	if err != nil {
		return nil, err
	}

	for _, message := range messages {
		response = append(response, Message{
			ID:        message.ID.String(),
			UserID:    message.UserId.String(),
			RoomID:    message.RoomId.String(),
			Message:   message.Message,
			CreatedAt: message.CreatedAt.String(),
		})
	}
	return response, nil
}
