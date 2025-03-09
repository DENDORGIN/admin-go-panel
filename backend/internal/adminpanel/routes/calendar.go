package routes

import (
	"backend/internal/adminpanel/db/postgres"
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/models"
	"backend/internal/adminpanel/services/utils"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"log"
	"net/http"
)

func CreateEventHandler(ctx *gin.Context) {

	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return
	}

	var event entities.Calendar
	if err := ctx.ShouldBindJSON(&event); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	event.UserID = userID

	newEvent, err := models.CreateEvent(&event)
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

	event, err := models.GetEventById(eventId)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}
	if event.UserID != userID {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "You are not authorized to update this event"})
		return
	}

	updatedEvent, err := models.CalendarUpdateEvent(eventId, &updateEvent)
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

	events, err := models.GetAllEvents(userID)
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

	eventId, err := uuid.Parse(eventIdStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Event ID format"})
		return
	}

	getEvent, err := models.GetEventById(eventId)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}

	if getEvent.UserID != userID {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized to delete this event"})
		return
	}

	err = models.DeleteEventById(eventId)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Event deleted successfully"})

}

func SendReminders() {
	events, err := models.GetUpcomingReminders()
	if err != nil {
		log.Println("❌ Помилка отримання подій:", err)
		return
	}

	if len(events) == 0 {
		log.Println("✅ Немає подій для нагадування.")
		return
	}

	log.Printf("🔔 Знайдено %d подій для нагадування.\n", len(events))
	for _, event := range events {

		user, err := models.GetUserById(event.UserID)
		if err != nil {
			log.Printf("⚠️ Подія '%s' не має email користувача, пропущено.\n", event.Title)
			continue
		}

		subject := fmt.Sprintf("🔔 Нагадування: %s", event.Title)
		message := fmt.Sprintf(`
			<h3>Привіт, %s!</h3>
			<p>Нагадуємо, що подія <strong>%s</strong> розпочнеться <strong>%s</strong>.</p>
			<p>Деталі: %s</p>
			<hr>
			<p><em>Це автоматичне повідомлення. Не відповідайте на нього.</em></p>`,
			user.Email, event.Title, event.StartDate.Format("02.01.2006 15:04"), event.Description,
		)

		err = utils.SendEmail(user.Email, subject, message, true)
		if err != nil {
			log.Printf("❌ Помилка відправки email для події '%s' (%s): %v\n", event.Title, event.User.Email, err)
		} else {
			log.Printf("✅ Нагадування надіслано: %s (%s)\n", event.Title, event.User.Email)
		}
		err = postgres.DB.Model(&entities.Calendar{}).Where("id = ?", event.ID).Update("send_email", true).Error
		if err != nil {
			log.Printf("❌ Помилка оновлення поля SendEmail для події '%s': %v\n", event.Title, err)
		} else {
			log.Printf("✅ Поле SendEmail оновлено для події '%s'.\n", event.Title)
		}

	}
}
