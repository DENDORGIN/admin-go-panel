package models

import (
	"backend/internal/adminpanel/db/postgres"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

type Media struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	ContentId uuid.UUID `gorm:"type:uuid;" json:"content_id"`
	Url       string    `gorm:"type:string" json:"url"`
	Type      string    `gorm:"type:string" json:"type"`
	CreatedAt time.Time `gorm:"type:time" json:"created_at"`
}

func (c *Media) BeforeCreate(*gorm.DB) error {
	c.ID = uuid.New()
	return nil
}

type MediaPublic struct {
	ID        uuid.UUID `json:"id"`
	Url       string    `json:"url"`
	Type      string    `json:"type"`
	ContentID uuid.UUID `json:"content_id"`
}

func DownloadFiles(media *Media) (*MediaPublic, error) {
	media.ID = uuid.New()

	if err := postgres.DB.Create(&media).Error; err != nil {
		return nil, err
	}

	return &MediaPublic{
		ID:        media.ID,
		Url:       media.Url,
		Type:      media.Type,
		ContentID: media.ContentId,
	}, nil
}
