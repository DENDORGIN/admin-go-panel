package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func GetUserIDFromContext(ctx *gin.Context) (uuid.UUID, bool) {
	userIDRaw, exists := ctx.Get("id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return uuid.UUID{}, false
	}

	userID, ok := userIDRaw.(uuid.UUID)
	if !ok {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return uuid.UUID{}, false
	}

	return userID, true
}
