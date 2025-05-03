package models

import (
	"github.com/google/uuid"
	"time"
)

type DirectChat struct {
	ID        uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	UserAID   uuid.UUID `gorm:"type:uuid;not null;index"`
	UserBID   uuid.UUID `gorm:"type:uuid;not null;index"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

type DirectMessage struct {
	ID        uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	ChatID    uuid.UUID `gorm:"type:uuid;not null;index"`
	SenderID  uuid.UUID `gorm:"type:uuid;not null;index"`
	Message   string    `gorm:"type:text"`
	Reaction  string    `gorm:"type:text"`
	CreatedAt time.Time
	EditedAt  time.Time
}
