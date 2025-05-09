package models

import (
	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
	"time"
)

type Employees struct {
	ID                uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	UserID            uuid.UUID  `gorm:"type:uuid;not null;uniqueIndex" json:"user_id"`
	PhoneNumber1      string     `gorm:"type:varchar(255);default:null" json:"phone_number_1"`
	PhoneNumber2      string     `gorm:"type:varchar(255);default:null" json:"phone_number_2"`
	Company           string     `gorm:"type:varchar(255);default:null" json:"company"`
	Position          string     `gorm:"type:varchar(255);default:null" json:"position"`
	ConditionType     string     `gorm:"type:varchar(255);default:null" json:"condition_type"`
	Salary            string     `gorm:"type:varchar(255);default:null" json:"salary"`
	Address           string     `gorm:"type:varchar(255);default:null" json:"address"`
	DateStart         *time.Time `json:"date_start"`
	DateEnd           *time.Time `json:"date_end"`
	CreatedAt         time.Time
	UpdatedAt         time.Time
	ExtraData         datatypes.JSON `gorm:"type:jsonb" json:"extra_data"`
	WhuCreatedByID    uuid.UUID      `gorm:"type:uuid;" json:"whu_created_by_id"`
	WhuCreatedByAcron string         `gorm:"type:varchar(255)" json:"whu_created_by_acron"`
	WhuUpdatedByID    *uuid.UUID     `gorm:"type:uuid;" json:"whu_updated_by_id"`
	WhuUpdatedByAcron *string        `gorm:"type:varchar(255)" json:"whu_updated_by_acron"`
}

func (e *Employees) BeforeCreate(*gorm.DB) error {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	return nil
}
