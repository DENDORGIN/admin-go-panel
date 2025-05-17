package service

import (
	"backend/modules/notifications/handlers"
	"github.com/google/uuid"
	"log"
	"time"
)

type NotificationPayload struct {
	Title  string    `json:"title"`
	Body   string    `json:"body"`
	Type   string    `json:"type"` // chat, system, etc
	Meta   any       `json:"meta,omitempty"`
	SentAt time.Time `json:"sent_at"`
}

func SendNotification(userID uuid.UUID, payload NotificationPayload) {
	msg := handlers.NotificationMessage{
		Type:    "new_notification",
		Payload: payload,
	}
	log.Println("📨 Надсилаємо сповіщення користувачу:", userID)
	handlers.Manager.SendToUser(userID, msg)
}
