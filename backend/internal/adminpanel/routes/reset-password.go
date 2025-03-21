package routes

import (
	"backend/internal/adminpanel/models"
	"backend/internal/adminpanel/services/utils"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"net/http"
)

type ResetPasswordRequest struct {
	Token       string `json:"token"`
	NewPassword string `json:"newPassword"`
}

func RequestPasswordRecover(ctx *gin.Context) {
	email := ctx.Param("email")

	db, exists := ctx.Get("DB")
	if !exists {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "DB connection missing"})
		return
	}

	// Перевірка чи існує користувач з таким email
	user, err := models.GetUserByEmail(db.(*gorm.DB), email)
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

func ResetPassword(ctx *gin.Context) {
	var req ResetPasswordRequest
	db, exists := ctx.Get("DB")
	if !exists {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "DB connection missing"})
		return
	}

	// Отримуємо токен і новий пароль із тіла запиту
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	if req.Token == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Token is required"})
		return
	}

	// Перевірка токена
	claims, err := utils.VerifyResetToken(req.Token)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// Зміна пароля
	_, err = models.ResetCurrentUserPassword(db.(*gorm.DB), claims.Email, req.NewPassword)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Password reset successfully"})
}
