package repository

import (
	"backend/internal/repository"
	models2 "backend/modules/chat/messages/models"
	mediaModel "backend/modules/media/models"
	"backend/modules/media/service"
	"backend/modules/reaction/models"
	reactionDTO "backend/modules/reaction/models"
	userModel "backend/modules/user/models"
	"fmt"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"slices"
	"time"
)

func GetMessagesPaginated(db *gorm.DB, roomId uuid.UUID, limit int, before *uuid.UUID) ([]models2.Message, error) {
	var messages []models2.Messages
	var response []models2.Message

	query := db.Where("room_id = ?", roomId).Order("created_at DESC").Limit(limit)

	if before != nil {
		var beforeMsg models2.Messages
		if err := db.Select("created_at").First(&beforeMsg, "id = ?", *before).Error; err == nil {
			query = query.Where("created_at < ?", beforeMsg.CreatedAt)
		}
	}

	if err := query.Find(&messages).Error; err != nil {
		return nil, err
	}

	// 🌐 Зворотній порядок: від старих до нових
	slices.Reverse(messages)

	// 2️⃣ Отримуємо user_id для масового запиту
	userIDs := make(map[uuid.UUID]bool)
	messageIDs := make([]uuid.UUID, 0, len(messages))
	for _, msg := range messages {
		userIDs[msg.UserId] = true
		messageIDs = append(messageIDs, msg.ID)
	}

	// 3️⃣ Отримуємо юзерів
	var users []struct {
		ID       uuid.UUID
		FullName string
		Avatar   string
	}
	if err := db.Table("users").
		Select("id, full_name, avatar").
		Where("id IN (?)", keys(userIDs)).
		Find(&users).Error; err != nil {
		return nil, err
	}

	// 4️⃣ Створюємо user map
	userMap := make(map[uuid.UUID]struct {
		FullName string
		Avatar   string
	})
	for _, u := range users {
		userMap[u.ID] = struct {
			FullName string
			Avatar   string
		}{
			FullName: u.FullName,
			Avatar:   u.Avatar,
		}
	}

	var reactions []models.Reaction
	if err := db.Where("message_id IN ?", messageIDs).Find(&reactions).Error; err != nil {
		return nil, err
	}

	reactionMap := make(map[uuid.UUID][]reactionDTO.ReactionDTO)
	for _, r := range reactions {
		reactionMap[r.MessageID] = append(reactionMap[r.MessageID], reactionDTO.ReactionDTO{
			UserID: r.UserId.String(),
			Emoji:  r.Emoji,
		})
	}

	// 5️⃣ Отримуємо всі медіа по повідомленнях
	var media []mediaModel.Media
	if err := db.Where("content_id IN (?)", messageIDs).Find(&media).Error; err != nil {
		return nil, err
	}

	// 6️⃣ Групуємо медіа по content_id
	mediaMap := make(map[uuid.UUID][]string)
	for _, m := range media {
		mediaMap[m.ContentId] = append(mediaMap[m.ContentId], m.Url)
	}

	// 7️⃣ Формуємо остаточну відповідь
	for _, msg := range messages {
		userData := userMap[msg.UserId]
		var editedAt *string
		if msg.EditedAt != nil {
			formatted := msg.EditedAt.Format("2006-01-02 15:04:05")
			editedAt = &formatted
		}
		response = append(response, models2.Message{
			ID:         msg.ID.String(),
			UserID:     msg.UserId.String(),
			FullName:   userData.FullName,
			Avatar:     userData.Avatar,
			RoomID:     msg.RoomId.String(),
			Message:    msg.Message,
			ContentUrl: getOrEmpty(mediaMap, msg.ID),
			CreatedAt:  msg.CreatedAt.Format("2006-01-02 15:04:05"),
			EditedAt:   editedAt,
			Reactions:  reactionMap[msg.ID],
		})
	}

	return response, nil
}

func GetMessageById(db *gorm.DB, messageID uuid.UUID) (*models2.Message, error) {
	var message models2.Messages
	var user userModel.User
	var media []mediaModel.Media

	err := repository.GetByID(db, messageID, &message)
	if err != nil {
		return nil, err
	}

	err = repository.GetByID(db, message.UserId, &user)
	if err != nil {
		return nil, err
	}

	err = repository.GetAllMediaByID(db, messageID, &media)
	if err != nil {
		return nil, err
	}
	mediaMap := make(map[uuid.UUID][]string)
	for _, m := range media {
		mediaMap[m.ContentId] = append(mediaMap[m.ContentId], m.Url)
	}
	var editedAt *string
	if message.EditedAt != nil {
		formatted := message.EditedAt.Format("2006-01-02 15:04:05")
		editedAt = &formatted
	}

	return &models2.Message{
		ID:         message.ID.String(),
		UserID:     message.UserId.String(),
		FullName:   user.FullName,
		Avatar:     user.Avatar,
		RoomID:     message.RoomId.String(),
		Message:    message.Message,
		ContentUrl: getOrEmpty(mediaMap, message.ID),
		CreatedAt:  message.CreatedAt.Format("2006-01-02 15:04:05"),
		EditedAt:   editedAt,
	}, err

}

func EditMessageById(db *gorm.DB, messageID, userID uuid.UUID, editMessage *models2.EditMessage) (*models2.Message, error) {
	var message models2.Messages

	err := repository.GetByID(db, messageID, &message)
	if err != nil {
		return nil, err
	}

	if message.UserId != userID {
		return nil, fmt.Errorf("access denied: user is not the author")
	}
	if editMessage.Message != "" {
		message.Message = editMessage.Message
		now := time.Now()
		message.EditedAt = &now
	}

	err = db.Save(&message).Error
	if err != nil {
		return nil, err
	}
	return GetMessageById(db, messageID)
}

func DeleteMessageById(db *gorm.DB, messageID, userID uuid.UUID) error {
	var message models2.Messages
	var mediaList []mediaModel.Media

	err := repository.GetByID(db, messageID, &message)
	if err != nil {
		return err
	}

	if message.UserId != userID {
		return fmt.Errorf("access denied: user is not the author")
	}

	err = repository.DeleteByID(db, messageID, &message)
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

	err = repository.DeleteContentByID(db, messageID, &mediaModel.Media{})
	if err != nil {
		return err
	}

	return nil
}

// Допоміжна функція для отримання ключів з `map`
func keys(m map[uuid.UUID]bool) []uuid.UUID {
	result := make([]uuid.UUID, 0, len(m))
	for k := range m {
		result = append(result, k)
	}
	return result
}

func getOrEmpty(m map[uuid.UUID][]string, key uuid.UUID) []string {
	if val, ok := m[key]; ok {
		return val
	}
	return []string{} // повертаємо порожній slice замість nil
}
