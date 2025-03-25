package routes

import (
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/models"
	"backend/internal/adminpanel/services/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"net/http"
)

func CreateEventHandler(ctx *gin.Context) {

	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return
	}

	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		return
	}

	var event entities.Calendar
	if err := ctx.ShouldBindJSON(&event); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	event.UserID = userID

	newEvent, err := models.CreateEvent(db, &event)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, newEvent)
}

func UpdateCalendarEventHandler(ctx *gin.Context) {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return
	}

	eventIdStr := ctx.Param("id")
	if eventIdStr == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Event ID is required"})
		return
	}
	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		return
	}

	eventId, err := uuid.Parse(eventIdStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Event ID format"})
		return
	}
	var updateEvent models.CalendarEventUpdate
	if err = ctx.ShouldBindJSON(&updateEvent); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	event, err := models.GetEventById(db, eventId)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}
	if event.UserID != userID {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "You are not authorized to update this event"})
		return
	}

	updatedEvent, err := models.CalendarUpdateEvent(db, eventId, &updateEvent)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, updatedEvent)

}

func GetAllEventsHandler(ctx *gin.Context) {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return
	}
	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		return
	}

	events, err := models.GetAllEvents(db, userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, events)
}

func DeleteEvent(ctx *gin.Context) {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return
	}

	eventIdStr := ctx.Param("id")
	if eventIdStr == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Event ID is required"})
		return
	}
	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		return
	}

	eventId, err := uuid.Parse(eventIdStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Event ID format"})
		return
	}

	getEvent, err := models.GetEventById(db, eventId)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}

	if getEvent.UserID != userID {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized to delete this event"})
		return
	}

	err = models.DeleteEventById(db, eventId)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Event deleted successfully"})

}
