package routes

import (
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/models"
	"backend/internal/adminpanel/services/utils"
	"fmt"
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

	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		return
	}

	var item entities.Items
	if err := ctx.ShouldBindJSON(&item); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	item.OwnerID = userID

	newItem, err := models.CreateItem(db, &item)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, newItem)
}

func GetItemByID(ctx *gin.Context) {

	itemId, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}
	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		return
	}

	user, ok := utils.GetCurrentUserFromContext(ctx, db)
	if !ok {
		return
	}
	fmt.Println(user.IsSuperUser)

	item, err := models.GetItemById(db, itemId)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if item.OwnerID != user.ID && !user.IsSuperUser {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Access denied"})
		return
	}

	ctx.JSON(http.StatusOK, item)

}

func GetAvailableLanguages(ctx *gin.Context) {
	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		return
	}

	var langs []string
	err := db.Model(&entities.Items{}).Distinct("language").Pluck("language", &langs).Error
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"languages": langs})
}

func GetAvailableCategories(ctx *gin.Context) {
	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		return
	}

	var categories []string
	err := db.Model(&entities.Items{}).Distinct("category").Pluck("category", &categories).Error
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"categories": categories})
}

func UpdateItemByIdHandler(ctx *gin.Context) {

	id, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}
	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		return
	}

	user, ok := utils.GetCurrentUserFromContext(ctx, db)
	if !ok {
		return
	}

	var update models.ItemUpdate
	if err := ctx.ShouldBindJSON(&update); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	item, err := models.UpdateItemById(db, id, &update)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if item.OwnerID != user.ID && !user.IsSuperUser {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Access denied"})
		return
	}

	ctx.JSON(http.StatusOK, item)

}

func GetAllItemsHandler(ctx *gin.Context) {

	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		return
	}

	user, ok := utils.GetCurrentUserFromContext(ctx, db)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	isSuperUser, _ := utils.GetIsSuperUser(db, user.ID)

	language := ctx.DefaultQuery("language", "pl")
	skip, _ := strconv.Atoi(ctx.DefaultQuery("skip", "0"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "100"))

	params := &entities.Parameters{
		Language: language,
		Skip:     skip,
		Limit:    limit,
	}

	items, err := models.GetAllItems(db, user.ID, isSuperUser, params)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, items)
}

func DeleteItemByIdHandler(ctx *gin.Context) {

	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		return
	}

	user, ok := utils.GetCurrentUserFromContext(ctx, db)
	if !ok {
		return
	}

	id, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	item, err := models.GetItemById(db, id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if item.OwnerID != user.ID || !user.IsSuperUser {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Access denied"})
		return
	}
	err = models.DeleteItemById(db, id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"success": "Item deleted"})
}
