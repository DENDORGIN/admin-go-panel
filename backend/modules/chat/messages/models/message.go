package models

import (
	"backend/modules/user/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

type Messages struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserId    uuid.UUID `gorm:"type:uuid;" json:"user_id"`
	RoomId    uuid.UUID `gorm:"type:uuid;" json:"room_id"`
	Message   string    `gorm:"type:string" json:"message"`
	CreatedAt time.Time `gorm:"type:time" json:"created_at"`
	UpdatedAt time.Time
	EditedAt  *time.Time  `gorm:"type:timestamp"`
	User      models.User `gorm:"foreignKey:UserId;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
}

func (message *Messages) BeforeCreate(*gorm.DB) error {
	if message.ID == uuid.Nil {
		message.ID = uuid.New()
	}
	return nil
}
