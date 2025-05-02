package handlers

import (
	utils2 "backend/internal/services/utils"
	models2 "backend/modules/chat/rooms/models"
	"backend/modules/chat/rooms/repository"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"net/http"
)

func CreateRoomHandler(ctx *gin.Context) {

	userID, ok := utils2.GetUserIDFromContext(ctx)
	if !ok {
		return
	}

	db, ok := utils2.GetDBFromContext(ctx)
	if !ok {
		return
	}

	var room models2.ChatRooms
	if err := ctx.ShouldBindJSON(&room); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	room.OwnerId = userID

	newBlog, err := repository.CreateRoom(db, &room)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, newBlog)
}

func GetAllRoomsHandler(ctx *gin.Context) {
	_, ok := utils2.GetUserIDFromContext(ctx)
	if !ok {
		return
	}

	db, ok := utils2.GetDBFromContext(ctx)
	if !ok {
		return
	}

	room, err := repository.GetAllRooms(db)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, room)
}

func GetRoomByIdHandler(ctx *gin.Context) {

	id, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid blog ID"})
		return
	}
	db, ok := utils2.GetDBFromContext(ctx)
	if !ok {
		return
	}

	room, err := repository.GetRoomById(db, id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, room)
}

func UpdateRoomByIdHandler(ctx *gin.Context) {
	userID, ok := utils2.GetUserIDFromContext(ctx)
	if !ok {
		return
	}

	db, ok := utils2.GetDBFromContext(ctx)
	if !ok {
		return
	}

	id, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid blog ID"})
		return
	}

	var update models2.RoomUpdate
	if err = ctx.ShouldBindJSON(&update); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	room, err := repository.UpdateRoomById(db, id, &update)
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
	userID, ok := utils2.GetUserIDFromContext(ctx)
	if !ok {
		return
	}

	db, ok := utils2.GetDBFromContext(ctx)
	if !ok {
		return
	}

	roomId, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid blog ID"})
		return
	}

	room, err := repository.GetRoomById(db, roomId)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	isSuperUser, err := utils2.GetIsSuperUser(db, userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if room.OwnerId != userID || !isSuperUser {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Access denied"})
		return
	}
	err = repository.DeleteRoomById(db, roomId)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.Status(http.StatusOK)
}
