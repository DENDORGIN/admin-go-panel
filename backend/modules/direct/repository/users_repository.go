package repository

import (
	"backend/modules/direct/models"
	userModel "backend/modules/user/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func GetDirectChatUsersByUserID(db *gorm.DB, userID uuid.UUID) ([]userModel.UserResponse, error) {
	var chats []models.DirectChat
	if err := db.Where("user_a_id = ? OR user_b_id = ?", userID, userID).Find(&chats).Error; err != nil {
		return nil, err
	}

	var otherUserIDs []uuid.UUID
	for _, chat := range chats {
		if chat.UserAID == userID {
			otherUserIDs = append(otherUserIDs, chat.UserBID)
		} else {
			otherUserIDs = append(otherUserIDs, chat.UserAID)
		}
	}

	seen := map[uuid.UUID]bool{}
	uniqueIDs := make([]uuid.UUID, 0)
	for _, id := range otherUserIDs {
		if !seen[id] {
			seen[id] = true
			uniqueIDs = append(uniqueIDs, id)
		}
	}

	var users []userModel.User
	if err := db.Where("id IN ?", uniqueIDs).Find(&users).Error; err != nil {
		return nil, err
	}

	var responses []userModel.UserResponse
	for _, u := range users {
		responses = append(responses, userModel.UserResponse{
			ID:          u.ID,
			FullName:    u.FullName,
			Avatar:      u.Avatar,
			Email:       u.Email,
			IsActive:    u.IsActive,
			IsSuperUser: u.IsSuperUser,
			Acronym:     u.Acronym,
		})
	}

	return responses, nil
}
