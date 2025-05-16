package models

import (
	"github.com/google/uuid"
	"time"
)

type DirectMessagePayload struct {
	Type       string     `json:"type"` // "new_message", "edit_message", etc.
	ID         uuid.UUID  `json:"ID"`   // для оновлень/видалень
	ChatID     uuid.UUID  `json:"ChatID"`
	SenderID   uuid.UUID  `json:"SenderID"`
	Message    string     `json:"Message"`
	ContentURL []string   `json:"content_url"`
	Reaction   string     `json:"Reaction"`
	IsRead     bool       `json:"isRead"`
	EditedAt   *time.Time `json:"EditedAt,omitempty"`
	CreatedAt  time.Time  `json:"CreatedAt"`
}

type EditMessage struct {
	Message string `json:"message"`
}

type Reaction struct {
	Reaction string `json:"reaction"`
}
