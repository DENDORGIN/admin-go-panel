package handlers

import (
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/services/utils"
	"backend/modules/user/models"
	"backend/modules/user/repository"
	utils2 "backend/modules/user/utils"
	"errors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"log"
	"net/http"
)

func LoginHandler(ctx *gin.Context) {
	var loginRequest = models.LoginRequest{}
	if err := ctx.ShouldBindJSON(&loginRequest); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid login request"})
		return
	}

	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		return
	}

	user, err := repository.GetUserByEmail(db, loginRequest.Email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if !utils2.ComparePasswords(loginRequest.Password, user.Password) {
		log.Println("Password mismatch for user:", user.Email)
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Tenant отримуємо з middleware-контексту
	tenant, ok := ctx.Get("tenant")
	if !ok {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Tenant info missing"})
		return
	}

	tenantData := tenant.(entities.Tenant)

	token, err := utils.GenerateJWTToken(user.Email, user.ID, tenantData.Domain, tenantData.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate token"})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"access_token": token, "token_type": "bearer"})
	log.Println("Login successful")
}
