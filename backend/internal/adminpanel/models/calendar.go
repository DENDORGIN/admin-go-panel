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

type CalendarEvent struct {
	ID        uuid.UUID
	Title     string    `json:"title"`
	StartDate time.Time `json:"startDate"`
	EndDate   time.Time `json:"endDate"`
	AllDay    bool      `json:"allDay"`
	Color     string    `json:"color"`
	UserID    uuid.UUID `json:"user_id"`
}

func CreateEvent(c *Calendar) (*CalendarEvent, error) {
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
	return &CalendarEvent{
		ID:        c.ID,
		Title:     c.Title,
		StartDate: c.StartDate,
		EndDate:   c.EndDate,
		AllDay:    c.AllDay,
		Color:     c.Color,
		UserID:    c.UserID,
	}, nil

}

func GetAllEvents(userId uuid.UUID) ([]CalendarEvent, error) {
	var events []Calendar
	var response []CalendarEvent

	err := postgres.DB.Where("user_id =?", userId).Find(&events).Error
	if err != nil {
		return nil, err
	}

	if len(events) == 0 {
		return []CalendarEvent{}, nil
	}

	for _, event := range events {
		response = append(response, CalendarEvent{
			ID:        event.ID,
			Title:     event.Title,
			StartDate: event.StartDate,
			EndDate:   event.EndDate,
			AllDay:    event.AllDay,
			Color:     event.Color,
			UserID:    event.UserID,
		})
	}
	return response, nil
}
