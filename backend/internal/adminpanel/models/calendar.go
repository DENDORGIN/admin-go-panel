package models

import (
	"backend/internal/adminpanel/db/postgres"
	"errors"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

type Calendar struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Title     string    `gorm:"not null" json:"title"`
	StartDate time.Time `gorm:"not null" json:"startDate"`
	EndDate   time.Time `gorm:"not null" json:"endDate"`
	AllDay    bool      `gorm:"not null" json:"allDay"`
	Color     string    `gorm:"not null" json:"color"`
	UserID    uuid.UUID `gorm:"not null;index" json:"-"`
	User      User      `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user"`
}

func (c *Calendar) BeforeCreate(*gorm.DB) error {
	c.ID = uuid.New()
	return nil
}

type CalendarEventCreate struct {
	ID        uuid.UUID
	Title     string    `json:"title"`
	StartDate time.Time `json:"startDate"`
	EndDate   time.Time `json:"endDate"`
	AllDay    bool      `json:"allDay"`
	Color     string    `json:"color"`
	UserID    uuid.UUID `json:"user"`
}

func CreateEvent(c *Calendar) (*CalendarEventCreate, error) {
	if c.Title == "" {
		return nil, errors.New("the event name cannot be empty")
	}
	if c.StartDate.After(c.EndDate) {
		return nil, errors.New("the start date cannot be later than the end date")
	}

	c.ID = uuid.New()

	err := postgres.DB.Create(c).Error
	if err != nil {
		return nil, err
	}
	return &CalendarEventCreate{
		ID:        c.ID,
		Title:     c.Title,
		StartDate: c.StartDate,
		EndDate:   c.EndDate,
		AllDay:    c.AllDay,
		Color:     c.Color,
		UserID:    c.UserID,
	}, nil

}
