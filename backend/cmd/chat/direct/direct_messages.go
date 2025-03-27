package direct

import (
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/services/utils"
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

type MessageResponse struct {
	ID        uuid.UUID      `json:"id"`
	Text      string         `json:"text"`
	CreatedAt time.Time      `json:"created_at"`
	From      SimpleUserInfo `json:"from"`
}

type SimpleUserInfo struct {
	ID          uuid.UUID `json:"id"`
	FullName    string    `json:"full_name"`
	Avatar      string    `json:"avatar"`
	IsActive    bool      `json:"isActive"`
	IsSuperUser bool      `json:"isSuperUser"`
}

func GetMessagesHandler(ctx *gin.Context) {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return
	}

	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		return
	}

	otherID, err := uuid.Parse(ctx.Param("user_id"))
	if err != nil {
		ctx.JSON(400, gin.H{"error": "invalid user id"})
		return
	}

	// Знайти або створити розмову
	var conv entities.Conversations
	err = db.Where(
		"(user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)",
		userID, otherID, otherID, userID,
	).First(&conv).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		ctx.JSON(200, gin.H{"messages": []string{}})
		return
	}

	// Отримати всі повідомлення
	var messages []entities.DirectMessage
	err = db.
		Preload("Sender").
		Where("conversation_id = ?", conv.ID).
		Order("created_at ASC").
		Find(&messages).Error

	if err != nil {
		ctx.JSON(500, gin.H{"error": "cannot fetch messages"})
		return
	}
	var result []MessageResponse
	for _, m := range messages {
		result = append(result, MessageResponse{
			ID:        m.ID,
			Text:      m.Text,
			CreatedAt: m.CreatedAt,
			From: SimpleUserInfo{
				ID:          m.Sender.ID,
				FullName:    m.Sender.FullName,
				Avatar:      m.Sender.Avatar,
				IsActive:    m.Sender.IsActive,
				IsSuperUser: m.Sender.IsSuperUser,
			},
		})
	}

	ctx.JSON(200, gin.H{"messages": result})
}
