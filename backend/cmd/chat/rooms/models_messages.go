package rooms

import (
	"backend/internal/adminpanel/entities"
	"github.com/google/uuid"
	"gorm.io/gorm"
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
		response = append(response, Message{
			ID:         msg.ID.String(),
			UserID:     msg.UserId.String(),
			FullName:   userData.FullName,
			Avatar:     userData.Avatar,
			RoomID:     msg.RoomId.String(),
			Message:    msg.Message,
			ContentUrl: getOrEmpty(mediaMap, msg.ID),
			CreatedAt:  msg.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	return response, nil
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
