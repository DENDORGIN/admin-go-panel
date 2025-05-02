package models

import (
	"backend/modules/user/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

type DirectMessage struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	ConversationID uuid.UUID `gorm:"not null"`
	SenderID       uuid.UUID `gorm:"type:uuid;not null"`
	Text           string    `gorm:"type:text;not null"`
	Read           bool      `gorm:"default:false"`
	CreatedAt      time.Time

	Sender       models.User   `gorm:"foreignKey:SenderID"`
	Conversation Conversations `gorm:"foreignKey:ConversationID"`
}

func (dm *DirectMessage) BeforeCreate(*gorm.DB) error {
	dm.ID = uuid.New()
	return nil
}
