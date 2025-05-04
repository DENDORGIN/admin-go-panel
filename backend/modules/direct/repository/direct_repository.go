package repository

import (
	"backend/internal/repository"
	"backend/modules/direct/models"
	mediaModel "backend/modules/media/models"
	userModel "backend/modules/user/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func GetMessageById(db *gorm.DB, messageID uuid.UUID) (*models.DirectMessagePayload, error) {
	var message models.DirectMessage
	var sender userModel.User
	var mediaList []mediaModel.Media

	err := repository.GetByID(db, messageID, &message)
	if err != nil {
		return nil, err
	}

	err = repository.GetByID(db, message.SenderID, &sender)
	if err != nil {
		return nil, err
	}
	err = repository.GetAllMediaByID(db, messageID, &mediaList)
	if err != nil {
		return nil, err
	}
	mediaMap := make(map[uuid.UUID][]string)
	for _, m := range mediaList {
		mediaMap[m.ContentId] = append(mediaMap[m.ContentId], m.Url)
	}

	return &models.DirectMessagePayload{
		ID:         message.ID,
		ChatID:     message.ChatID,
		UserID:     sender.ID,
		Message:    message.Message,
		ContentURL: getOrEmpty(mediaMap, message.ID),
		Reaction:   "",
		CreatedAt:  message.CreatedAt,
		EditedAt:   &message.EditedAt,
	}, err
}

func getOrEmpty(m map[uuid.UUID][]string, key uuid.UUID) []string {
	if val, ok := m[key]; ok {
		return val
	}
	return []string{} // повертаємо порожній slice замість nil
}
