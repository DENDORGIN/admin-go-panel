package utils

import (
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/repository"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"net/http"
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

func GetIsSuperUser(db *gorm.DB, id uuid.UUID) (bool, error) {
	var user entities.User
	err := repository.GetByID(db, id, &user)
	if err != nil {
		return false, err
	}

	return user.IsSuperUser, nil
}
