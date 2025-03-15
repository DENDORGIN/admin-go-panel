package rooms

import (
	"backend/internal/adminpanel/db/postgres"
	"backend/internal/adminpanel/entities"
	"github.com/google/uuid"
)

type Message struct {
	ID        string `json:"id"`
	UserID    string `json:"user_id"`
	FullName  string `json:"full_name"`
	RoomID    string `json:"room_id"`
	Message   string `json:"message"`
	CreatedAt string `json:"created_at"`
}

func GetAllMessages(roomId uuid.UUID) ([]Message, error) {
	var messages []entities.Messages
	var response []Message

	// Отримуємо всі повідомлення для кімнати
	err := postgres.DB.Where("room_id = ?", roomId).Order("created_at ASC").Find(&messages).Error
	if err != nil {
		return nil, err
	}

	// 1️⃣ Отримуємо унікальні user_id
	userIDs := make(map[uuid.UUID]bool)
	for _, message := range messages {
		userIDs[message.UserId] = true
	}

	// 2️⃣ Отримуємо всіх користувачів одним SQL-запитом
	var users []struct {
		ID       uuid.UUID
		FullName string
	}
	err = postgres.DB.Table("users").
		Select("id, full_name").
		Where("id IN (?)", keys(userIDs)).
		Find(&users).Error
	if err != nil {
		return nil, err
	}

	// 3️⃣ Створюємо мапу userID → FullName
	userMap := make(map[uuid.UUID]string)
	for _, user := range users {
		userMap[user.ID] = user.FullName
	}

	// 4️⃣ Заповнюємо відповідь з правильними іменами
	for _, message := range messages {
		response = append(response, Message{
			ID:        message.ID.String(),
			UserID:    message.UserId.String(),
			FullName:  userMap[message.UserId], // ✅ Підставляємо ім'я
			RoomID:    message.RoomId.String(),
			Message:   message.Message,
			CreatedAt: message.CreatedAt.Format("2006-01-02 15:04:05"),
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
