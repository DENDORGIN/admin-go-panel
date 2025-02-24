package models

import (
	"backend/internal/adminpanel/db/postgres"
	"backend/internal/adminpanel/services/utils"
	"errors"
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

func GetAllMediaByBlogId(blogID uuid.UUID) ([]MediaPublic, error) {
	var media []Media
	var listMedia []MediaPublic
	result := postgres.DB.Where("content_id =?", blogID).Find(&media)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, gorm.ErrRecordNotFound
	}

	for _, item := range media {
		listMedia = append(listMedia, MediaPublic{
			ID:        item.ID,
			Url:       item.Url,
			Type:      item.Type,
			ContentID: item.ContentId,
		})
	}
	return listMedia, nil
}

func GetMediaByUrl(url string) (*MediaPublic, error) {
	var media Media
	result := postgres.DB.Where("url =?", url).First(&media)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	return &MediaPublic{
		ID:        media.ID,
		Url:       media.Url,
		Type:      media.Type,
		ContentID: media.ContentId,
	}, nil
}

func DeleteFiles(id uuid.UUID) error {
	err := DeleteInBucket(id)
	if err != nil {
		return err
	}

	result := postgres.DB.Where("id = ?", id).Delete(&Media{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("user not found")
	}
	return nil
}

func DeleteInBucket(id uuid.UUID) error {
	var media *Media

	err := postgres.DB.Where("id", id).First(&media).Error
	if err != nil {
		return err
	}
	fileName := utils.ExtractFileNameFromURL(media.Url)
	//fmt.Println(fileName)
	err = utils.DeleteFile(fileName)
	if err != nil {
		return err
	}
	return nil
}
