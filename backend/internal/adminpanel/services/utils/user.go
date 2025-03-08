package utils

import (
	"backend/internal/adminpanel/db/postgres"
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/repository"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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

func GetIsSuperUser(id uuid.UUID) (bool, error) {
	var user entities.User
	err := repository.GetByID(postgres.DB, id, &user)
	if err != nil {
		return false, err
	}

	return user.IsSuperUser, nil
}
