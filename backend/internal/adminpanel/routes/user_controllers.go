package routes

import (
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/models"
	"backend/internal/adminpanel/services/utils"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"log"
	"net/http"
	"strconv"
)

func LoginHandler(ctx *gin.Context) {
	var loginRequest = entities.LoginRequest{}
	if err := ctx.ShouldBindJSON(&loginRequest); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid login request"})
		return
	}

	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		return
	}

	user, err := models.GetUserByEmail(db, loginRequest.Email)
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

func CreateUser(ctx *gin.Context) {
	user := new(entities.User)
	if err := ctx.ShouldBindJSON(user); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		return
	}

	newUser, err := models.CreateUser(db, user)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, newUser)
}

func ReadUserMe(ctx *gin.Context) {
	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		return
	}

	user, ok := utils.GetCurrentUserFromContext(ctx, db)
	if !ok {
		return
	}
	response := &models.UserResponse{
		ID:          user.ID,
		FullName:    user.FullName,
		Avatar:      user.Avatar,
		Email:       user.Email,
		IsActive:    user.IsActive,
		IsSuperUser: user.IsSuperUser,
	}
	ctx.JSON(http.StatusOK, response)
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
	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		return
	}

	users, err := models.GetAllUsers(db, limit, skip)
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
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return
	}

	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		return
	}

	var updateUser models.UpdateUser
	if err := ctx.ShouldBindJSON(&updateUser); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedUser, err := models.UpdateUserById(db, userID, &updateUser)
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
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return
	}

	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		return
	}

	var updatePassword models.UpdatePassword
	if err := ctx.ShouldBindJSON(&updatePassword); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	message, err := models.UpdateCurrentUserPassword(db, userID, &updatePassword)
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
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userIDRaw := ctx.Param("id")
	fmt.Println(userIDRaw)
	id, err := uuid.Parse(userIDRaw)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		return
	}

	isSuperUser, err := utils.GetIsSuperUser(db, userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	isTargetSuperUser, err := utils.GetIsSuperUser(db, id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if isTargetSuperUser && isSuperUser {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "Cannot delete a superuser"})
		return
	}

	if !isSuperUser && id != userID {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized to delete this user"})
		return
	}

	err = models.DeleteUserById(db, id)
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
