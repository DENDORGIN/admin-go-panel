package models

import "backend/modules/reaction/models"

type Message struct {
	ID         string               `json:"id"`
	UserID     string               `json:"user_id"`
	FullName   string               `json:"full_name"`
	Avatar     string               `json:"avatar"`
	RoomID     string               `json:"room_id"`
	Message    string               `json:"message"`
	ContentUrl []string             `json:"content_url"`
	CreatedAt  string               `json:"created_at"`
	EditedAt   *string              `json:"edited_at,omitempty"`
	Reactions  []models.ReactionDTO `json:"reactions,omitempty"`
}

type EditMessage struct {
	Message string `json:"message"`
}
