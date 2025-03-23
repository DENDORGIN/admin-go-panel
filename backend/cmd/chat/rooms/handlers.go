package rooms

import (
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/models"
	"backend/internal/adminpanel/services/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"net/http"
)

func CreateRoomHandler(ctx *gin.Context) {

	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return
	}

	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		return
	}

	var room entities.ChatRooms
	if err := ctx.ShouldBindJSON(&room); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	room.OwnerId = userID

	newBlog, err := CreateRoom(db, &room)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, newBlog)
}

func GetAllRoomsHandler(ctx *gin.Context) {
	_, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return
	}

	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		return
	}

	blogs, err := GetAllRooms(db)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, blogs)
}

func GetBlogByIdHandler(ctx *gin.Context) {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return
	}

	id, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid blog ID"})
		return
	}
	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		return
	}

	blog, err := models.GetBlogById(db, id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if blog.OwnerID != userID {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Access denied"})
		return
	}

	ctx.JSON(http.StatusOK, blog)
}

func UpdateRoomByIdHandler(ctx *gin.Context) {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return
	}

	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		return
	}

	id, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid blog ID"})
		return
	}

	var update RoomUpdate
	if err = ctx.ShouldBindJSON(&update); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	room, err := UpdateRoomById(db, id, &update)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if room.OwnerId != userID {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Access denied"})
		return
	}

	ctx.JSON(http.StatusOK, room)

}

func DeleteRoomByIdHandler(ctx *gin.Context) {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return
	}

	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		return
	}

	roomId, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid blog ID"})
		return
	}

	room, err := GetRoomById(db, roomId)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	isSuperUser, err := utils.GetIsSuperUser(db, userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if room.OwnerId != userID || !isSuperUser {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Access denied"})
		return
	}
	err = DeleteRoomById(db, roomId)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.Status(http.StatusOK)
}
