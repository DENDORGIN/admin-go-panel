package models

import (
	"github.com/google/uuid"
	"time"
)

type DirectMessagePayload struct {
	Type       string     `json:"type"` // "new_message", "edit_message", etc.
	ID         uuid.UUID  `json:"id"`   // для оновлень/видалень
	ChatID     uuid.UUID  `json:"chat_id"`
	UserID     uuid.UUID  `json:"user_id"`
	Message    string     `json:"message"`
	ContentURL []string   `json:"content_url"`
	Reaction   string     `json:"reaction"`
	EditedAt   *time.Time `json:"edited_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}

type EditMessage struct {
	Message string `json:"message"`
}

type Reaction struct {
	Reaction string `json:"reaction"`
}
