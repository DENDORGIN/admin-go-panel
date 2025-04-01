package models

import (
	"backend/internal/adminpanel/entities"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ReactionPayload struct {
	UserID    uuid.UUID `json:"user_id"`
	MessageID uuid.UUID `json:"message_id"`
	Emoji     string    `json:"emoji"`
}

func ToggleReaction(db *gorm.DB, payload ReactionPayload) ([]entities.Reaction, error) {
	var existing entities.Reaction

	err := db.Where("user_id = ? AND message_id = ? AND emoji = ?", payload.UserID, payload.MessageID, payload.Emoji).
		First(&existing).Error

	if err == nil {
		// вже є — видаляємо
		if err := db.Delete(&existing).Error; err != nil {
			return nil, err
		}
	} else if err == gorm.ErrRecordNotFound {
		// немає — додаємо
		newReaction := entities.Reaction{
			UserId:    payload.UserID,
			MessageID: payload.MessageID,
			Emoji:     payload.Emoji,
		}
		if err := db.Create(&newReaction).Error; err != nil {
			return nil, err
		}
	} else {
		return nil, err // інша помилка
	}

	// Повертаємо всі реакції на це повідомлення
	var updated []entities.Reaction
	if err := db.Where("message_id = ?", payload.MessageID).Find(&updated).Error; err != nil {
		return nil, err
	}

	return updated, nil
}
