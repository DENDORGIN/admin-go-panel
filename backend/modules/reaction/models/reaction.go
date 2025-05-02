package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

type Reaction struct {
	ID        uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	UserId    uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	MessageID uuid.UUID `gorm:"type:uuid;not null" json:"message_id"`
	Emoji     string    `gorm:"type:text;not null" json:"emoji"`
	CreatedAt time.Time `json:"created_at"`
}

func (emoji *Reaction) BeforeCreate(*gorm.DB) error {
	if emoji.ID == uuid.Nil {
		emoji.ID = uuid.New()
	}
	return nil
}
