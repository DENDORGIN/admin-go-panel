package models

import (
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/repository"
	"errors"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PropertyGet struct {
	ID        uuid.UUID `json:"ID"`
	Height    string    `json:"height"`
	Width     string    `json:"width"`
	Weight    string    `json:"weight"`
	Color     string    `json:"color"`
	Material  string    `json:"material"`
	Brand     string    `json:"brand"`
	Size      string    `json:"size"`
	Motif     string    `json:"motif"`
	Style     string    `json:"style"`
	ContentID uuid.UUID `json:"content_id"`
}

type PropertyUpdate struct {
	Height   string `json:"height"`
	Width    string `json:"width"`
	Weight   string `json:"weight"`
	Color    string `json:"color"`
	Material string `json:"material"`
	Brand    string `json:"brand"`
	Size     string `json:"size"`
	Motif    string `json:"motif"`
	Style    string `json:"style"`
}

func CreateProperty(db *gorm.DB, c *entities.Property) (*PropertyGet, error) {
	err := repository.CreateEssence(db, c)
	if err != nil {
		return nil, err
	}
	return &PropertyGet{
		ID:        c.ID,
		Height:    c.Height,
		Width:     c.Width,
		Weight:    c.Weight,
		Color:     c.Color,
		Material:  c.Material,
		Brand:     c.Brand,
		Size:      c.Size,
		Motif:     c.Motif,
		Style:     c.Style,
		ContentID: c.ContentId,
	}, nil
}

func GetPropertyById(db *gorm.DB, id uuid.UUID) (*PropertyGet, error) {
	var property entities.Property
	err := repository.GetByID(db, id, &property)
	if err != nil {
		return nil, err
	}
	return &PropertyGet{
		ID:        property.ID,
		Height:    property.Height,
		Width:     property.Width,
		Weight:    property.Weight,
		Color:     property.Color,
		Material:  property.Material,
		Brand:     property.Brand,
		Size:      property.Size,
		Motif:     property.Motif,
		Style:     property.Style,
		ContentID: property.ContentId,
	}, nil
}

func GetPropertyByItemId(db *gorm.DB, itemid uuid.UUID) (*PropertyGet, error) {
	var property entities.Property
	err := repository.GetAllContentByID(db, itemid, &property)
	if err != nil {
		// Якщо запис не знайдено — повертаємо пусту структуру без помилки
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &PropertyGet{}, nil
		}
		// Якщо якась інша помилка — повертаємо її
		return nil, err
	}
	return &PropertyGet{
		ID:        property.ID,
		Height:    property.Height,
		Width:     property.Width,
		Weight:    property.Weight,
		Color:     property.Color,
		Material:  property.Material,
		Brand:     property.Brand,
		Size:      property.Size,
		Motif:     property.Motif,
		Style:     property.Style,
		ContentID: property.ContentId,
	}, nil
}

func UpdateProperty(db *gorm.DB, id uuid.UUID, update *PropertyUpdate) (*PropertyGet, error) {
	var property entities.Property
	err := repository.GetByID(db, id, &property)
	if err != nil {
		return nil, err
	}

	if update.Height != "" {
		property.Height = update.Height
	}
	if update.Width != "" {
		property.Width = update.Width
	}
	if update.Weight != "" {
		property.Weight = update.Weight
	}
	if update.Color != "" {
		property.Color = update.Color
	}
	if update.Material != "" {
		property.Material = update.Material
	}
	if update.Brand != "" {
		property.Brand = update.Brand
	}
	if update.Size != "" {
		property.Size = update.Size
	}
	if update.Motif != "" {
		property.Motif = update.Motif
	}
	if update.Style != "" {
		property.Style = update.Style
	}

	err = db.Save(&property).Error
	if err != nil {
		return nil, err
	}

	return &PropertyGet{
		ID:        property.ID,
		Height:    property.Height,
		Width:     property.Width,
		Weight:    property.Weight,
		Color:     property.Color,
		Material:  property.Material,
		Brand:     property.Brand,
		Size:      property.Size,
		Motif:     property.Motif,
		Style:     property.Style,
		ContentID: property.ContentId,
	}, nil
}

func DeleteProperty(db *gorm.DB, id uuid.UUID) error {
	err := repository.DeleteByID(db, id, &entities.Property{})
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil
	}
	return err
}
