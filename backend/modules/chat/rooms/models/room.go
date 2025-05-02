package models

import (
	models2 "backend/modules/chat/messages/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

type ChatRooms struct {
	ID          uuid.UUID          `gorm:"type:uuid;primaryKey" json:"id"`
	NameRoom    string             `gorm:"not null" json:"name_room"`
	Description string             `gorm:"type:string" json:"description"`
	Image       string             `gorm:"not null" json:"image"`
	Status      bool               `gorm:"default:false" json:"status"`
	IsChannel   bool               `gorm:"default:false" json:"is_channel"`
	OwnerId     uuid.UUID          `gorm:"type:uuid;" json:"owner_id"`
	CreatedAt   time.Time          `gorm:"type:time" json:"created_at"`
	Messages    []models2.Messages `gorm:"foreignKey:RoomId;constraint:OnDelete:CASCADE" json:"messages"`
}

func (chatRoom *ChatRooms) BeforeCreate(*gorm.DB) error {
	chatRoom.ID = uuid.New()
	return nil
}
