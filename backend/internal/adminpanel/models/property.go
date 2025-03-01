package models

import (
	"backend/internal/adminpanel/db/postgres"
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/repository"
	"errors"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

//type Property struct {
//	ID       uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
//	Height   string    `gorm:"default:null" json:"height"`
//	Width    string    `gorm:"default:null" json:"width"`
//	Weight   string    `gorm:"default:null" json:"weight"`
//	Color    string    `gorm:"default:null" json:"color"`
//	Material string    `gorm:"default:null" json:"material"`
//	Brand    string    `gorm:"default:null" json:"brand"`
//	Size     string    `gorm:"default:null" json:"size"`
//	Motif    string    `gorm:"default:null" json:"motif"`
//	Style    string    `gorm:"default:null" json:"style"`
//	ItemId   uuid.UUID `gorm:"not null;index" json:"item_id"`
//}

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

//func (c *Property) BeforeCreate(*gorm.DB) error {
//	c.ID = uuid.New()
//	return nil
//}

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
