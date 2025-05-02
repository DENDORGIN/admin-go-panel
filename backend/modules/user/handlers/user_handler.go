package handlers

import (
	utils2 "backend/internal/services/utils"
	"backend/modules/user/models"
	"backend/modules/user/repository"
	"backend/modules/user/service"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"net/http"
	"strconv"
)

func CreateUser(ctx *gin.Context) {
	user := new(models.User)
	if err := ctx.ShouldBindJSON(user); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db, ok := utils2.GetDBFromContext(ctx)
	if !ok {
		return
	}

	newUser, err := repository.CreateUser(db, user)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, newUser)
}

func ReadUserMe(ctx *gin.Context) {
	db, ok := utils2.GetDBFromContext(ctx)
	if !ok {
		return
	}

	user, ok := utils2.GetCurrentUserFromContext(ctx, db)
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
	db, ok := utils2.GetDBFromContext(ctx)
	if !ok {
		return
	}

	users, err := repository.GetAllUsers(db, limit, skip)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	userResponses := service.TransformUsers(users)
	response := models.AllUsers{
		Data:  userResponses,
		Count: len(userResponses),
	}
	ctx.JSON(http.StatusOK, response)
}

func UpdateCurrentUser(ctx *gin.Context) {
	userID, ok := utils2.GetUserIDFromContext(ctx)
	if !ok {
		return
	}

	db, ok := utils2.GetDBFromContext(ctx)
	if !ok {
		return
	}

	var updateUser models.UpdateUser
	if err := ctx.ShouldBindJSON(&updateUser); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedUser, err := repository.UpdateUserById(db, userID, &updateUser)
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

func DeleteUser(ctx *gin.Context) {
	userID, ok := utils2.GetUserIDFromContext(ctx)
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
	db, ok := utils2.GetDBFromContext(ctx)
	if !ok {
		return
	}

	isSuperUser, err := utils2.GetIsSuperUser(db, userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	isTargetSuperUser, err := utils2.GetIsSuperUser(db, id)
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

	err = repository.DeleteUserById(db, id)
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
