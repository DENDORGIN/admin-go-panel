package models

import "github.com/google/uuid"

type ReactionPayload struct {
	UserID    uuid.UUID `json:"user_id"`
	MessageID uuid.UUID `json:"message_id"`
	Emoji     string    `json:"emoji"`
}

type ReactionDTO struct {
	UserID string `json:"user_id"`
	Emoji  string `json:"emoji"`
}
