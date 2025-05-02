package repository

import (
	"backend/modules/reaction/models"
	"gorm.io/gorm"
)

func ToggleReaction(db *gorm.DB, payload models.ReactionPayload) ([]models.Reaction, error) {
	var existing models.Reaction

	// Шукаємо будь-яку реакцію цього користувача на це повідомлення
	err := db.Where("user_id = ? AND message_id = ?", payload.UserID, payload.MessageID).
		First(&existing).Error

	if err == nil {
		if existing.Emoji == payload.Emoji {
			// Натиснув ту саму реакцію — видаляємо
			if err := db.Delete(&existing).Error; err != nil {
				return nil, err
			}
		} else {
			// Натиснув іншу — оновлюємо
			existing.Emoji = payload.Emoji
			if err := db.Save(&existing).Error; err != nil {
				return nil, err
			}
		}
	} else if err == gorm.ErrRecordNotFound {
		// Немає — додаємо
		newReaction := models.Reaction{
			UserId:    payload.UserID,
			MessageID: payload.MessageID,
			Emoji:     payload.Emoji,
		}
		if err := db.Create(&newReaction).Error; err != nil {
			return nil, err
		}
	} else {
		return nil, err // Інша помилка
	}

	// Повертаємо всі реакції на це повідомлення
	var updated []models.Reaction
	if err := db.Where("message_id = ?", payload.MessageID).Find(&updated).Error; err != nil {
		return nil, err
	}

	return updated, nil
}
