package models

import (
	"github.com/google/uuid"
	"time"
)

type DirectMessagePayload struct {
	Type       string     `json:"type"` // "new_message", "edit_message", etc.
	ID         uuid.UUID  `json:"ID"`   // для оновлень/видалень
	ChatID     uuid.UUID  `json:"ChatId"`
	SenderID   uuid.UUID  `json:"SenderId"`
	Message    string     `json:"Message"`
	ContentURL []string   `json:"ContentUrl"`
	Reaction   string     `json:"Reaction"`
	EditedAt   *time.Time `json:"edited_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}

type EditMessage struct {
	Message string `json:"message"`
}

type Reaction struct {
	Reaction string `json:"reaction"`
}
