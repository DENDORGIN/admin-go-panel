package models

import "github.com/google/uuid"

type RoomPublic struct {
	ID          uuid.UUID
	NameRoom    string    `json:"name_room"`
	Description string    `json:"description"`
	Image       string    `json:"image"`
	Status      bool      `json:"status"`
	IsChannel   bool      `json:"is_channel"`
	OwnerId     uuid.UUID `json:"owner_id"`
}

type RoomUpdate struct {
	NameRoom    string `json:"name_room"`
	Description string `json:"description"`
	Image       string `json:"image"`
	Status      bool   `json:"status"`
}

type RoomGetAll struct {
	Data  []*RoomPublic
	Count int
}
