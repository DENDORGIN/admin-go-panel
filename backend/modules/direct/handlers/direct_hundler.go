package handlers

import (
	utils "backend/internal/services/utils"
	"backend/modules/direct/models"
	"backend/modules/direct/repository"
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"log"
	"net/http"
	"strconv"
)

func GetOrCreateDirectChat(ctx *gin.Context) {
	var body struct {
		UserID uuid.UUID `json:"user_id" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&body); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		log.Println("❌ DB context відсутній")
		ctx.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	currentUserID, exists := ctx.Get("id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "user ID missing in context"})
		return
	}
	userID, ok := currentUserID.(uuid.UUID)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "user ID invalid"})
		return
	}

	var chat models.DirectChat
	if err := db.Where(
		"(user_a_id = ? AND user_b_id = ?) OR (user_a_id = ? AND user_b_id = ?)",
		currentUserID, body.UserID, body.UserID, currentUserID,
	).First(&chat).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			chat = models.DirectChat{
				ID:      uuid.New(),
				UserAID: userID,
				UserBID: body.UserID,
			}
			if err := db.Create(&chat).Error; err != nil {
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		} else {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	ctx.JSON(http.StatusOK, chat)
}

func GetDirectMessages(ctx *gin.Context) {
	chatID, err := uuid.Parse(ctx.Param("chatId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid chat ID"})
		return
	}
	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		log.Println("❌ DB context відсутній")
		ctx.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	page, err := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(ctx.DefaultQuery("limit", "30"))
	if err != nil || limit < 1 || limit > 100 {
		limit = 30
	}

	var messages []models.DirectMessage

	if err := db.
		Where("chat_id = ?", chatID).
		Order("created_at DESC").
		Offset((page - 1) * limit).
		Limit(limit).
		Find(&messages).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"messages": messages,
		"page":     page,
		"limit":    limit,
	})
}

func GetDirectMessageById(ctx *gin.Context) {
	messageID, err := uuid.Parse(ctx.Param("messageId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid message ID"})
		return
	}
	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		log.Println("❌ DB context відсутній")
		ctx.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	message, err := repository.GetMessageById(db, messageID)

	ctx.JSON(http.StatusOK, message)
}
