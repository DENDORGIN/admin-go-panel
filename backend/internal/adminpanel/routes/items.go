package routes

import (
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/models"
	"backend/internal/adminpanel/services/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"net/http"
	"strconv"
)

func CreateItemHandler(ctx *gin.Context) {

	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return
	}

	var item entities.Items
	if err := ctx.ShouldBindJSON(&item); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	item.OwnerID = userID

	newItem, err := models.CreateItem(&item)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, newItem)
}

func GetItemByID(ctx *gin.Context) {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return
	}

	itemId, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid blog ID"})
		return
	}

	item, err := models.GetItemById(itemId)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if item.OwnerID != userID {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Access denied"})
		return
	}

	ctx.JSON(http.StatusOK, item)

}

func UpdateItemByIdHandler(ctx *gin.Context) {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return
	}

	id, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid blog ID"})
		return
	}

	var update models.ItemUpdate
	if err := ctx.ShouldBindJSON(&update); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	item, err := models.UpdateItemById(id, &update)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if item.OwnerID != userID {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Access denied"})
		return
	}

	ctx.JSON(http.StatusOK, item)

}

func GetAllItemsHandler(ctx *gin.Context) {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Отримуємо параметри запиту
	language := ctx.DefaultQuery("language", "pl")
	skip, _ := strconv.Atoi(ctx.DefaultQuery("skip", "0"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "100"))

	// Перевірка коректності значень
	if skip < 0 {
		skip = 0
	}
	if limit <= 0 {
		limit = 100
	}

	// Формуємо структуру параметрів
	params := &entities.Parameters{
		Language: language,
		Skip:     skip,
		Limit:    limit,
	}

	// Викликаємо основну функцію
	items, err := models.GetAllItems(userID, params)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, items)
}
