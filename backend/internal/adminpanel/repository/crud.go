package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func GetByID[T any](db *gorm.DB, id uuid.UUID, model *T) error {
	err := db.Where("id = ?", id).First(model).Error
	if err != nil {
		return err
	}
	return nil
}

func GetAllMediaByID[T any](db *gorm.DB, id uuid.UUID, model *T) error {

	err := db.Where("content_id = ?", id).Find(model).Error
	if err != nil {
		return err
	}
	return nil
}

func DeleteByID[T any](db *gorm.DB, id uuid.UUID, model *T) error {
	err := db.Where("id = ?", id).Delete(model).Error
	if err != nil {
		return err
	}
	return nil
}

func DeleteMediaByID[T any](db *gorm.DB, id uuid.UUID, model *T) error {
	err := db.Where("content_id = ?", id).Delete(model).Error
	if err != nil {
		return err
	}
	return nil
}
