package direct

import (
	"backend/internal/entities"
	"backend/modules/user/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func GetDirectChatUsers(db *gorm.DB, userID uuid.UUID) ([]models.UserResponse, error) {
	var conversations []entities.Conversations

	err := db.
		Where("user1_id = ? OR user2_id = ?", userID, userID).
		Find(&conversations).Error
	if err != nil {
		return nil, err
	}

	userMap := make(map[uuid.UUID]bool)
	var userIDs []uuid.UUID

	for _, conv := range conversations {
		var otherID uuid.UUID
		if conv.User1ID == userID {
			otherID = conv.User2ID
		} else {
			otherID = conv.User1ID
		}
		if !userMap[otherID] {
			userMap[otherID] = true
			userIDs = append(userIDs, otherID)
		}
	}

	var users []models.User
	if len(userIDs) > 0 {
		err = db.Where("id IN ?", userIDs).Find(&users).Error
		if err != nil {
			return nil, err
		}
	}

	var responses []models.UserResponse
	for _, user := range users {
		responses = append(responses, models.UserResponse{
			ID:          user.ID,
			FullName:    user.FullName,
			Email:       user.Email,
			Avatar:      user.Avatar,
			IsActive:    user.IsActive,
			IsSuperUser: user.IsSuperUser,
		})
	}

	return responses, nil
}

func LoadAllConversations(db *gorm.DB, userID uuid.UUID) (map[uuid.UUID][]MessageResponse, error) {
	var conversations []entities.Conversations

	err := db.
		Where("user1_id = ? OR user2_id = ?", userID, userID).
		Preload("DirectMessage", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at ASC").Preload("Sender")
		}).
		Find(&conversations).Error

	if err != nil {
		return nil, err
	}

	result := make(map[uuid.UUID][]MessageResponse)

	for _, conv := range conversations {
		var otherUserID uuid.UUID
		if conv.User1ID == userID {
			otherUserID = conv.User2ID
		} else {
			otherUserID = conv.User1ID
		}

		var messages []MessageResponse
		for _, msg := range conv.DirectMessage {
			messages = append(messages, MessageResponse{
				ID:        msg.ID,
				Text:      msg.Text,
				CreatedAt: msg.CreatedAt,
				From: SimpleUserInfo{
					ID:          msg.Sender.ID,
					FullName:    msg.Sender.FullName,
					Avatar:      msg.Sender.Avatar,
					IsActive:    msg.Sender.IsActive,
					IsSuperUser: msg.Sender.IsSuperUser,
				},
			})
		}

		result[otherUserID] = messages
	}

	return result, nil
}
