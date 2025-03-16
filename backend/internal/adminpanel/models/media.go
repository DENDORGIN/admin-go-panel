package models

import (
	"backend/internal/adminpanel/db/postgres"
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/repository"
	"backend/internal/adminpanel/services/utils"
	"errors"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MediaPublic struct {
	ID        uuid.UUID `json:"id"`
	Url       string    `json:"url"`
	Type      string    `json:"type"`
	ContentID uuid.UUID `json:"content_id"`
}

func DownloadFiles(media *entities.Media) (*MediaPublic, error) {
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
	var media []entities.Media
	var listMedia []MediaPublic

	err := repository.GetAllMediaByID(postgres.DB, blogID, &media)
	if err != nil {
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

//func GetMediaByUrl(url string) (*MediaPublic, error) {
//	var media entities.Media
//	result := postgres.DB.Where("url =?", url).First(&media)
//	if result.Error != nil {
//		return nil, result.Error
//	}
//	if result.RowsAffected == 0 {
//		return nil, gorm.ErrRecordNotFound
//	}
//	return &MediaPublic{
//		ID:        media.ID,
//		Url:       media.Url,
//		Type:      media.Type,
//		ContentID: media.ContentId,
//	}, nil
//}

func DeleteFiles(id uuid.UUID) error {
	err := DeleteInBucket(id)
	if err != nil {
		return err
	}

	err = repository.DeleteByID(postgres.DB, id, &entities.Media{})

	if err != nil {
		return errors.New("user not found")
	}
	return nil
}

func DeleteInBucket(id uuid.UUID) error {
	var media *entities.Media

	err := repository.GetByID(postgres.DB, id, &media)
	if err != nil {
		return err
	}

	err = utils.DeleteImageInBucket(media.Url)
	if err != nil {
		return err
	}
	return nil
}
