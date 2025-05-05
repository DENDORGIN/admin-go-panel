package handlers

import (
	"backend/internal/services/utils"
	"backend/modules/direct/repository"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"net/http"
)

func GetDirectChatUsers(ctx *gin.Context) {
	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		ctx.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	rawID, ok := ctx.Get("id")
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "missing user id"})
		return
	}
	userID := rawID.(uuid.UUID)

	users, err := repository.GetDirectChatUsersByUserID(db, userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, users)
}
