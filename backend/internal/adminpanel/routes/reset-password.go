package routes

import (
	"backend/internal/adminpanel/models"
	"backend/internal/adminpanel/services/utils"
	"github.com/gin-gonic/gin"
	"net/http"
)

type PasswordResetRequest struct {
	Email string `json:"email" binding:"required,email"`
}

func RequestPasswordReset(ctx *gin.Context) {
	var req PasswordResetRequest

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid email format"})
		return
	}

	// Перевірка чи існує користувач з таким email
	user, err := models.GetUserByEmail(req.Email)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Генерація токена для відновлення пароля
	resetToken, err := utils.GenerateResetToken(user.Email)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate reset token"})
		return
	}

	// Надсилання листа відновлення пароля
	if err := utils.SendPasswordResetEmail(user.Email, resetToken); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send reset email"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Password reset email sent successfully"})
}
