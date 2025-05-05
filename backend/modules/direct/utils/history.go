package utils

import (
	"backend/modules/direct/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func LoadRecentDirectMessages(db *gorm.DB, chatID uuid.UUID, limit int) ([]models.DirectMessage, error) {
	var messages []models.DirectMessage
	err := db.
		Where("chat_id = ?", chatID).
		Order("created_at DESC").
		Limit(limit).
		Find(&messages).Error

	// Переворот повідомлень для коректного порядку
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, err
}
