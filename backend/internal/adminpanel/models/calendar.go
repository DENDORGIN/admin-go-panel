package models

import (
	"backend/internal/adminpanel/db/postgres"
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/repository"
	"errors"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

type CalendarEvent struct {
	ID          uuid.UUID
	Title       string    `json:"title"`
	Description string    `json:"description"`
	StartDate   time.Time `json:"startDate"`
	EndDate     time.Time `json:"endDate"`
	AllDay      bool      `json:"allDay"`
	Color       string    `json:"color"`
	WorkingDay  bool      `json:"workingDay"`
	SickDay     bool      `json:"sickDay"`
	Vacation    bool      `json:"vacation"`
	Weekend     bool      `json:"weekend"`
	UserID      uuid.UUID `json:"user_id"`
}

type CalendarEventUpdate struct {
	Title       string    `json:"title"`
	Description string    `json:"description"`
	StartDate   time.Time `json:"startDate"`
	EndDate     time.Time `json:"endDate"`
	AllDay      bool      `json:"allDay"`
	Color       string    `json:"color"`
	WorkingDay  bool      `json:"workingDay"`
	SickDay     bool      `json:"sickDay"`
	Vacation    bool      `json:"vacation"`
	Weekend     bool      `json:"weekend"`
}

func CreateEvent(c *entities.Calendar) (*CalendarEvent, error) {
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
		ID:          c.ID,
		Title:       c.Title,
		Description: c.Description,
		StartDate:   c.StartDate,
		EndDate:     c.EndDate,
		AllDay:      c.AllDay,
		Color:       c.Color,
		WorkingDay:  c.WorkingDay,
		SickDay:     c.SickDay,
		Vacation:    c.Vacation,
		Weekend:     c.Weekend,
		UserID:      c.UserID,
	}, nil

}

func GetAllEvents(userId uuid.UUID) ([]CalendarEvent, error) {
	var events []entities.Calendar
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
			ID:          event.ID,
			Title:       event.Title,
			Description: event.Description,
			StartDate:   event.StartDate,
			EndDate:     event.EndDate,
			AllDay:      event.AllDay,
			Color:       event.Color,
			WorkingDay:  event.WorkingDay,
			SickDay:     event.SickDay,
			Vacation:    event.Vacation,
			Weekend:     event.Weekend,
			UserID:      event.UserID,
		})
	}
	return response, nil
}

func GetEventById(eventId uuid.UUID) (*CalendarEvent, error) {
	var calendar entities.Calendar

	err := repository.GetByID(postgres.DB, eventId, &calendar)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("event not found")
		}
		return nil, err
	}
	return &CalendarEvent{
		ID:          calendar.ID,
		Title:       calendar.Title,
		Description: calendar.Description,
		StartDate:   calendar.StartDate,
		EndDate:     calendar.EndDate,
		AllDay:      calendar.AllDay,
		Color:       calendar.Color,
		WorkingDay:  calendar.WorkingDay,
		SickDay:     calendar.SickDay,
		Vacation:    calendar.Vacation,
		Weekend:     calendar.Weekend,
		UserID:      calendar.UserID,
	}, nil
}

func CalendarUpdateEvent(eventId uuid.UUID, eventUpdate *CalendarEventUpdate) (*CalendarEvent, error) {
	var event entities.Calendar

	err := repository.GetByID(postgres.DB, eventId, &event)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("event not found")
		}
		return nil, err
	}

	if eventUpdate.Title != "" {
		event.Title = eventUpdate.Title
	}
	if eventUpdate.Description != "" {
		event.Description = eventUpdate.Description
	}
	if !eventUpdate.StartDate.IsZero() {
		event.StartDate = eventUpdate.StartDate
	}
	if !eventUpdate.EndDate.IsZero() {
		event.EndDate = eventUpdate.EndDate
	}
	if eventUpdate.AllDay {
		event.AllDay = eventUpdate.AllDay
	}
	if eventUpdate.Color != "" {
		event.Color = eventUpdate.Color
	}
	if eventUpdate.WorkingDay {
		event.WorkingDay = eventUpdate.WorkingDay
	}
	if eventUpdate.SickDay {
		event.SickDay = eventUpdate.SickDay
	}
	if eventUpdate.Vacation {
		event.Vacation = eventUpdate.Vacation
	}
	if eventUpdate.Weekend {
		event.Weekend = eventUpdate.Weekend
	}

	err = postgres.DB.Save(&event).Error
	if err != nil {
		return nil, err
	}
	return &CalendarEvent{
		ID:          event.ID,
		Title:       event.Title,
		Description: event.Description,
		StartDate:   event.StartDate,
		EndDate:     event.EndDate,
		AllDay:      event.AllDay,
		Color:       event.Color,
		WorkingDay:  event.WorkingDay,
		SickDay:     event.SickDay,
		Vacation:    event.Vacation,
		Weekend:     event.Weekend,
		UserID:      event.UserID,
	}, nil
}

func DeleteEventById(eventId uuid.UUID) error {
	err := repository.DeleteByID(postgres.DB, eventId, &entities.Calendar{})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("event not found")
		}
		return err
	}
	return nil
}
