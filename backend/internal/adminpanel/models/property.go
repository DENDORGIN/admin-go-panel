package models

import (
	"backend/internal/adminpanel/db/postgres"
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/repository"
	"errors"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PropertyGet struct {
	ID       uuid.UUID `json:"ID"`
	Height   string    `json:"height"`
	Width    string    `json:"width"`
	Weight   string    `json:"weight"`
	Color    string    `json:"color"`
	Material string    `json:"material"`
	Brand    string    `json:"brand"`
	Size     string    `json:"size"`
	Motif    string    `json:"motif"`
	Style    string    `json:"style"`
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

func CreateProperty(c *entities.Property) (*PropertyGet, error) {
	err := repository.CreateEssence(postgres.DB, c)
	if err != nil {
		return nil, err
	}
	return &PropertyGet{
		ID:       c.ID,
		Height:   c.Height,
		Width:    c.Width,
		Weight:   c.Weight,
		Color:    c.Color,
		Material: c.Material,
		Brand:    c.Brand,
		Size:     c.Size,
		Motif:    c.Motif,
		Style:    c.Style,
	}, nil
}

func GetPropertyById(Id uuid.UUID) (*PropertyGet, error) {
	var property entities.Property
	err := postgres.DB.Where("id =?", Id).First(&property).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &PropertyGet{
		ID:       property.ID,
		Height:   property.Height,
		Width:    property.Width,
		Weight:   property.Weight,
		Color:    property.Color,
		Material: property.Material,
		Brand:    property.Brand,
		Size:     property.Size,
		Motif:    property.Motif,
		Style:    property.Style,
	}, nil
}

func UpdateProperty(id uuid.UUID, update *PropertyUpdate) (*PropertyGet, error) {
	var property entities.Property
	err := repository.GetByID(postgres.DB, id, &property)
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
	err = postgres.DB.Save(&property).Error
	if err != nil {
		return nil, err
	}
	return &PropertyGet{
		ID:       property.ID,
		Height:   property.Height,
		Width:    property.Width,
		Weight:   property.Weight,
		Color:    property.Color,
		Material: property.Material,
		Brand:    property.Brand,
		Size:     property.Size,
		Motif:    property.Motif,
		Style:    property.Style,
	}, nil
}

func DeleteProperty(id uuid.UUID) error {
	err := repository.DeleteByID(postgres.DB, id, &entities.Property{})
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil
	}
	return err
}
