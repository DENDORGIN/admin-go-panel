package models

import (
	"backend/modules/user/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

type Conversations struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	User1ID   uuid.UUID `gorm:"type:uuid;not null"`
	User2ID   uuid.UUID `gorm:"type:uuid;not null"`
	CreatedAt time.Time

	User1 models.User `gorm:"foreignKey:User1ID"`
	User2 models.User `gorm:"foreignKey:User2ID"`

	DirectMessage []DirectMessage `gorm:"foreignKey:ConversationID"`
}

func (c *Conversations) BeforeCreate(*gorm.DB) error {
	c.ID = uuid.New()
	return nil
}
