package rooms

import (
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/repository"
	"backend/internal/adminpanel/services/utils"
	"fmt"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

type Message struct {
	ID         string   `json:"id"`
	UserID     string   `json:"user_id"`
	FullName   string   `json:"full_name"`
	Avatar     string   `json:"avatar"`
	RoomID     string   `json:"room_id"`
	Message    string   `json:"message"`
	ContentUrl []string `json:"content_url"`
	CreatedAt  string   `json:"created_at"`
	EditedAt   *string  `json:"edited_at,omitempty"`
}

type EditMessage struct {
	Message string `json:"message"`
}

func GetAllMessages(db *gorm.DB, roomId uuid.UUID) ([]Message, error) {
	var messages []entities.Messages
	var response []Message

	// 1️⃣ Отримуємо всі повідомлення в кімнаті
	if err := db.Where("room_id = ?", roomId).Order("created_at ASC").Find(&messages).Error; err != nil {
		return nil, err
	}

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

	// 5️⃣ Отримуємо всі медіа по повідомленнях
	var media []entities.Media
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
		response = append(response, Message{
			ID:         msg.ID.String(),
			UserID:     msg.UserId.String(),
			FullName:   userData.FullName,
			Avatar:     userData.Avatar,
			RoomID:     msg.RoomId.String(),
			Message:    msg.Message,
			ContentUrl: getOrEmpty(mediaMap, msg.ID),
			CreatedAt:  msg.CreatedAt.Format("2006-01-02 15:04:05"),
			EditedAt:   editedAt,
		})
	}

	return response, nil
}

func GetMessageById(db *gorm.DB, messageID uuid.UUID) (*Message, error) {
	var message entities.Messages
	var user entities.User
	var media []entities.Media

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

	return &Message{
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

func EditMessageById(db *gorm.DB, messageID, userID uuid.UUID, editMessage *EditMessage) (*Message, error) {
	var message entities.Messages

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
	var message entities.Messages
	var mediaList []entities.Media

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
		err = utils.DeleteImageInBucket(media.Url)
		if err != nil {
			return err
		}
	}

	err = repository.DeleteContentByID(db, messageID, &entities.Media{})
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
