package repository

import (
	"backend/internal/repository"

	"backend/modules/direct/models"
	mediaModel "backend/modules/media/models"
	"backend/modules/media/service"

	userModel "backend/modules/user/models"
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"log"
	"time"
)

func GetDirectMessagesPaginated(db *gorm.DB, chatId uuid.UUID, limit int, beforeID *uuid.UUID) ([]models.DirectMessagePayload, error) {
	var response []models.DirectMessagePayload
	var messages []models.DirectMessage

	query := db.Where("chat_id = ?", chatId).Order("created_at DESC")

	if beforeID != nil {
		var beforeMessage models.DirectMessage
		if err := db.Select("created_at").Where("id = ?", *beforeID).First(&beforeMessage).Error; err != nil {
			return nil, err
		}
		query = query.Where("created_at < ?", beforeMessage.CreatedAt)
	}

	if err := query.Limit(limit).Find(&messages).Error; err != nil {
		return nil, err
	}

	if len(messages) == 0 {
		return []models.DirectMessagePayload{}, nil
	}

	// отримання ID повідомлень
	messageIDs := make([]uuid.UUID, len(messages))
	for i, m := range messages {
		messageIDs[i] = m.ID
	}

	// Отримуємо реакції для повідомлень
	var reactions []models.Reaction
	if err := db.Where("message_id IN ?", messageIDs).Find(&reactions).Error; err != nil {
		return nil, err
	}

	// Отримуємо медіафайли для повідомлень
	var media []mediaModel.Media
	if err := db.Where("content_id IN ?", messageIDs).Find(&media).Error; err != nil {
		return nil, err
	}

	mediaMap := make(map[uuid.UUID][]string)
	for _, m := range media {
		mediaMap[m.ContentId] = append(mediaMap[m.ContentId], m.Url)
	}

	// Формуємо відповідь (перевертаємо для правильного порядку в чаті)
	for i := len(messages) - 1; i >= 0; i-- {
		msg := messages[i]
		response = append(response, models.DirectMessagePayload{
			ID:         msg.ID,
			SenderID:   msg.SenderID,
			ChatID:     msg.ChatID,
			Message:    msg.Message,
			ContentURL: getOrEmpty(mediaMap, msg.ID),
			CreatedAt:  msg.CreatedAt,
			EditedAt:   msg.EditedAt,
			Reaction:   msg.Reaction,
		})
	}

	return response, nil
}

func GetMessageById(db *gorm.DB, messageID uuid.UUID) (*models.DirectMessagePayload, error) {
	var message models.DirectMessage
	if err := repository.GetByID(db, messageID, &message); err != nil {
		return nil, fmt.Errorf("message not found: %w", err)
	}

	// Підтягуємо користувача
	var sender userModel.User
	if err := repository.GetByID(db, message.SenderID, &sender); err != nil {
		log.Printf("⚠️ user not found for message %s: %v", messageID, err)
	}

	// Підтягуємо медіа
	var mediaList []mediaModel.Media
	if err := repository.GetAllMediaByID(db, messageID, &mediaList); err != nil {
		log.Printf("⚠️ media not found for message %s: %v", messageID, err)
	}

	// Групуємо медіа по ContentID
	mediaMap := make(map[uuid.UUID][]string)
	for _, m := range mediaList {
		mediaMap[m.ContentId] = append(mediaMap[m.ContentId], m.Url)
	}

	// Формуємо payload
	return &models.DirectMessagePayload{
		ID:         message.ID,
		ChatID:     message.ChatID,
		SenderID:   message.SenderID,
		Message:    message.Message,
		ContentURL: getOrEmpty(mediaMap, message.ID),
		Reaction:   message.Reaction,
		CreatedAt:  message.CreatedAt,
		EditedAt:   message.EditedAt,
	}, nil
}

func getOrEmpty(m map[uuid.UUID][]string, key uuid.UUID) []string {
	if val, ok := m[key]; ok {
		return val
	}
	return []string{} // повертаємо порожній slice замість nil
}

func EditMessageByID(db *gorm.DB, messageID, userID uuid.UUID, newMessage *models.EditMessage) (*models.DirectMessagePayload, error) {
	var message models.DirectMessage

	// Отримуємо повідомлення
	if err := repository.GetByID(db, messageID, &message); err != nil {
		return nil, fmt.Errorf("message not found: %w", err)
	}

	// Перевіряємо, чи користувач — автор
	if message.SenderID != userID {
		return nil, fmt.Errorf("access denied: user is not the author")
	}

	// Оновлюємо текст і EditedAt
	if newMessage.Message != "" {
		message.Message = newMessage.Message
		now := time.Now()
		message.EditedAt = &now
	}

	// Зберігаємо оновлення
	if err := db.Save(&message).Error; err != nil {
		return nil, fmt.Errorf("failed to update message: %w", err)
	}

	// Повертаємо повну структуру
	payload, err := GetMessageById(db, messageID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch updated message: %w", err)
	}

	return payload, nil
}

func AddEmojiToMessage(db *gorm.DB, messageID uuid.UUID, reaction *models.Reaction) (*models.DirectMessagePayload, error) {
	var message models.DirectMessage

	// Отримуємо повідомлення
	if err := repository.GetByID(db, messageID, &message); err != nil {
		return nil, fmt.Errorf("message not found: %w", err)
	}

	// Оновлюємо текст і EditedAt
	if reaction.Reaction != "" {
		message.Reaction = reaction.Reaction
	}

	// Зберігаємо оновлення
	if err := db.Save(&message).Error; err != nil {
		return nil, fmt.Errorf("failed to update Emoji: %w", err)
	}

	// Повертаємо повну структуру
	payload, err := GetMessageById(db, messageID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch updated message: %w", err)
	}

	return payload, nil
}

func DeleteMessageByID(db *gorm.DB, messageID, userID uuid.UUID) error {
	var message models.DirectMessage
	var mediaList []mediaModel.Media

	if err := repository.GetByID(db, messageID, &message); err != nil {
		return fmt.Errorf("message not found: %w", err)
	}

	if message.SenderID != userID {
		return fmt.Errorf("access denied: user is not the author")
	}

	err := repository.DeleteByID(db, messageID, &message)
	if err != nil {
		return err
	}

	err = repository.GetAllMediaByID(db, messageID, &mediaList)
	if err != nil {
		return err
	}
	for _, media := range mediaList {
		err = service.DeleteImageInBucket(media.Url)
		if err != nil {
			return err
		}
	}

	// Видаляємо медіа з бази
	err = repository.DeleteContentByID(db, messageID, &mediaModel.Media{})
	if err != nil {
		return err
	}

	return nil
}
