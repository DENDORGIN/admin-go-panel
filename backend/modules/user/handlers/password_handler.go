package handlers

import (
	"backend/internal/adminpanel/services/utils"
	"backend/modules/user/models"
	"backend/modules/user/service"
	"github.com/gin-gonic/gin"
	"net/http"
)

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
	message, err := service.UpdateCurrentUserPassword(db, userID, &updatePassword)
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
