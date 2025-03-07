package repository

import (
	"errors"
	"fmt"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"reflect"
)

func CreateEssence[T any](db *gorm.DB, model *T) error {
	if idField := reflect.ValueOf(model).Elem().FieldByName("ID"); idField.IsValid() && idField.CanSet() {
		if idField.Interface() == uuid.Nil {
			idField.Set(reflect.ValueOf(uuid.New()))
		}
	}
	return db.Create(model).Error
}

func GetByID[T any](db *gorm.DB, id uuid.UUID, model *T) error {
	err := db.Where("id = ?", id).First(model).Error
	if err != nil {
		return err
	}
	return nil
}

func GetPosition[T any](db *gorm.DB, position int, model *T) error {
	err := db.Where("position = ?", position).First(model).Error
	if err != nil {
		return err
	}
	return nil
}

func DeleteByID[T any](db *gorm.DB, id uuid.UUID, model *T) error {
	err := db.Where("id = ?", id).Delete(model).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil
	}
	return err
}
func GetAllMediaByID[T any](db *gorm.DB, id uuid.UUID, model *T) error {
	err := db.Where("content_id = ?", id).Find(model).Error
	if err != nil {
		return err
	}
	return nil
}

func GetAllContentByID[T any](db *gorm.DB, id uuid.UUID, model *T) error {
	err := db.Where("content_id = ?", id).First(model).Error
	if err != nil {
		return err
	}
	return nil
}

func DeleteContentByID[T any](db *gorm.DB, id uuid.UUID, model *T) error {
	err := db.Where("content_id = ?", id).Delete(model).Error
	if err != nil {
		return err
	}
	return nil
}

// ShiftPositions зміщує всі записи вперед, якщо нова позиція вже зайнята
func ShiftPositions[T any](db *gorm.DB, newPosition int) error {
	var items []T

	// Отримуємо всі елементи, позиція яких >= newPosition
	err := db.Where("position >= ?", newPosition).Order("position ASC").Find(&items).Error
	if err != nil {
		return fmt.Errorf("failed to fetch items: %v", err)
	}

	// Перевіряємо, чи є елементи для зміщення
	if len(items) == 0 {
		return nil
	}

	for i := range items {
		v := reflect.ValueOf(&items[i]).Elem()
		positionField := v.FieldByName("Position")

		if positionField.IsValid() && positionField.CanSet() {
			positionField.SetInt(positionField.Int() + 1) // Зсуваємо позицію на +1
		} else {
			return fmt.Errorf("model does not have a 'Position' field or it's not settable")
		}
	}

	// Оновлюємо всі позиції в базі одним запитом
	for _, item := range items {
		if err := db.Save(&item).Error; err != nil {
			return fmt.Errorf("failed to update position: %v", err)
		}
	}

	return nil
}
