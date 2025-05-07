package handlers

import (
	utils2 "backend/internal/services/utils"
	"backend/modules/employees/models"
	"backend/modules/employees/repository"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"net/http"
)

func ReadUserEmployeesById(ctx *gin.Context) {
	userIDRaw := ctx.Param("id")
	id, err := uuid.Parse(userIDRaw)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	db, ok := utils2.GetDBFromContext(ctx)
	if !ok {
		return
	}

	user, err := repository.GetUserEmployeesById(db, id)
	if err != nil {
		if err.Error() == "user not found" {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	ctx.JSON(http.StatusOK, user)
}

func UpdateUserEmployeesByIdHandler(ctx *gin.Context) {
	userIDRaw := ctx.Param("id")
	id, err := uuid.Parse(userIDRaw)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	db, ok := utils2.GetDBFromContext(ctx)
	if !ok {
		return
	}

	user, ok := utils2.GetCurrentUserFromContext(ctx, db)
	if !ok {
		return
	}
	if !user.IsSuperUser {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "Permission denied"})
		return
	}

	var updateEmployee models.UpdateUserEmployees
	if err := ctx.ShouldBindJSON(&updateEmployee); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}

	employee, err := repository.UpdateUserEmployeesById(db, id, user.ID, &updateEmployee)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, employee)
}
