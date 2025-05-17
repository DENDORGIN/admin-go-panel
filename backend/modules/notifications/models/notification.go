package models

import (
	"github.com/google/uuid"
	"time"
)

type Notification struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	Title     string
	Body      string
	Type      string // "chat", "system", "reminder", тощо
	IsRead    bool
	CreatedAt time.Time
	ReadAt    *time.Time
}
