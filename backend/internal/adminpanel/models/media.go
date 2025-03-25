package models

import (
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

func DownloadFiles(db *gorm.DB, media *entities.Media) (*MediaPublic, error) {
	media.ID = uuid.New()

	if err := db.Create(&media).Error; err != nil {
		return nil, err
	}

	return &MediaPublic{
		ID:        media.ID,
		Url:       media.Url,
		Type:      media.Type,
		ContentID: media.ContentId,
	}, nil
}

func GetAllMediaByBlogId(db *gorm.DB, blogID uuid.UUID) ([]MediaPublic, error) {
	var media []entities.Media
	var listMedia []MediaPublic

	err := repository.GetAllMediaByID(db, blogID, &media)
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

//func GetMediaByUrl(db *gorm.DB, url string) (*MediaPublic, error) {
//	var media entities.Media
//	result := db.Where("url =?", url).First(&media)
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

func DeleteFiles(db *gorm.DB, id uuid.UUID) error {
	err := DeleteInBucket(db, id)
	if err != nil {
		return err
	}

	err = repository.DeleteByID(db, id, &entities.Media{})

	if err != nil {
		return errors.New("user not found")
	}
	return nil
}

func DeleteInBucket(db *gorm.DB, id uuid.UUID) error {
	var media *entities.Media

	err := repository.GetByID(db, id, &media)
	if err != nil {
		return err
	}

	err = utils.DeleteImageInBucket(media.Url)
	if err != nil {
		return err
	}
	return nil
}
