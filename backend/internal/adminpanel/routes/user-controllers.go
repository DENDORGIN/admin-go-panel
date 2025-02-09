package routes

import (
	"backend/internal/adminpanel/models"
	"backend/internal/adminpanel/services/utils"
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"log"
	"net/http"
	"strconv"
)

func LoginHandler(ctx *gin.Context) {
	var loginRequest = models.LoginRequest{}
	if err := ctx.ShouldBindJSON(&loginRequest); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid login request"})
		return
	}
	user, err := models.GetUserByEmail(loginRequest.Email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if !utils.ComparePasswords(loginRequest.Password, user.Password) {
		log.Println("Password mismatch for user:", user.Email)
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}
	token, err := utils.GenerateJWTToken(user.Email, user.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate token"})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"access_token": token, "token_type": "bearer"})
	log.Println("Login successful")
}

func CreateUser(ctx *gin.Context) {
	user := new(models.User)
	if err := ctx.ShouldBindJSON(user); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	newUser, err := models.CreateUser(user)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, newUser)
}

func ReadUserMe(ctx *gin.Context) {
	idValue, exists := ctx.Get("id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	id, ok := idValue.(uuid.UUID)
	if !ok {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	user, err := models.GetUserById(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, user)
}

func ReadAllUsers(ctx *gin.Context) {
	limitParam := ctx.DefaultQuery("limit", "100")
	skipParam := ctx.DefaultQuery("skip", "0")

	limit, err := strconv.Atoi(limitParam)
	if err != nil || limit < 0 {
		limit = 100
	}

	skip, err := strconv.Atoi(skipParam)
	if err != nil || skip < 0 {
		skip = 0
	}

	users, err := models.GetAllUsers(ctx, limit, skip)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	userResponses := models.TransformUsers(users)
	response := models.AllUsers{
		Data:  userResponses,
		Count: len(userResponses),
	}
	ctx.JSON(http.StatusOK, response)
}

func UpdateCurrentUser(ctx *gin.Context) {
	// Отримуємо ID користувача з контексту
	idValue, exists := ctx.Get("id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	id, ok := idValue.(uuid.UUID)
	if !ok {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	// Отримуємо дані для оновлення з тіла запиту
	var updateUser models.UpdateUser
	if err := ctx.ShouldBindJSON(&updateUser); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Оновлюємо дані користувача
	updatedUser, err := models.UpdateUserById(id, &updateUser)
	if err != nil {
		if err.Error() == "user not found" {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	ctx.JSON(http.StatusOK, updatedUser)
}

func UpdatePasswordCurrentUser(ctx *gin.Context) {
	// Отримуємо ID користувача з контексту
	idValue, exists := ctx.Get("id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	id, ok := idValue.(uuid.UUID)
	if !ok {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}
	var updatePassword models.UpdatePassword
	if err := ctx.ShouldBindJSON(&updatePassword); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	message, err := models.UpdateCurrentUserPassword(id, &updatePassword)
	if err != nil {
		if err.Error() == "user not found" {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": message})

}

func DeleteUser(ctx *gin.Context) {
	id := ctx.Param("id")

	err := models.DeleteUserById(id)
	if err != nil {
		if err.Error() == "user not found" {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}
