package handlers

import (
	"backend/internal/services/utils"
	"backend/modules/property/models"
	"backend/modules/property/repository"
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"net/http"
)

func CreatePropertiesHandler(ctx *gin.Context) {
	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		return
	}

	var property models.Property
	if err := ctx.ShouldBindJSON(&property); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	newProps, err := repository.CreateProperty(db, &property)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, newProps)
}

func GetPropertyByIDHandler(ctx *gin.Context) {
	id, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid property ID"})
		return
	}
	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		return
	}

	property, err := repository.GetPropertyById(db, id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, property)
}

func UpdatePropertyHandler(ctx *gin.Context) {
	id, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid property ID"})
		return
	}
	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		return
	}

	var update models.PropertyUpdate
	if err := ctx.ShouldBindJSON(&update); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedProperty, err := repository.UpdateProperty(db, id, &update)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Property not found"})
		return
	}

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, updatedProperty)
}

func DeletePropertyHandler(ctx *gin.Context) {
	id, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid property ID"})
		return
	}
	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		return
	}
	err = repository.DeleteProperty(db, id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.Status(http.StatusOK)
}
