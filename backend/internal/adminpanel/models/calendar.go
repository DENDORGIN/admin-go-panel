package models

import (
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/repository"
	"errors"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"log"
	"time"
)

type CalendarEvent struct {
	ID             uuid.UUID
	Title          string    `json:"title"`
	Description    string    `json:"description"`
	StartDate      time.Time `json:"startDate"`
	EndDate        time.Time `json:"endDate"`
	ReminderOffset int       `json:"reminderOffset"`
	AllDay         bool      `json:"allDay"`
	Color          string    `json:"color"`
	WorkingDay     bool      `json:"workingDay"`
	SickDay        bool      `json:"sickDay"`
	Vacation       bool      `json:"vacation"`
	Weekend        bool      `json:"weekend"`
	SendMail       bool      `json:"sendEmail"`
	ReminderSent   bool      `json:"reminderSent"`
	UserID         uuid.UUID `json:"user_id"`
}

type CalendarEventUpdate struct {
	Title          string    `json:"title"`
	Description    string    `json:"description"`
	StartDate      time.Time `json:"startDate"`
	EndDate        time.Time `json:"endDate"`
	ReminderOffset int       `json:"reminderOffset"`
	AllDay         bool      `json:"allDay"`
	Color          string    `json:"color"`
	WorkingDay     bool      `json:"workingDay"`
	SickDay        bool      `json:"sickDay"`
	Vacation       bool      `json:"vacation"`
	Weekend        bool      `json:"weekend"`
	SendMail       bool      `json:"sendEmail"`
	ReminderSent   bool      `json:"reminderSent"`
}

func CreateEvent(db *gorm.DB, c *entities.Calendar) (*CalendarEvent, error) {
	if c.Title == "" {
		return nil, errors.New("the event name cannot be empty")
	}
	if c.StartDate.After(c.EndDate) {
		return nil, errors.New("the start date cannot be after the end date")
	}
	// Завантажуємо часовий пояс Варшави
	warsawLoc, err := time.LoadLocation("Europe/Warsaw")
	if err != nil {
		log.Fatal(err)
	}

	// Гарантуємо, що час завжди в UTC
	c.ID = uuid.New()
	c.StartDate = c.StartDate.In(warsawLoc)
	c.EndDate = c.EndDate.In(warsawLoc)

	reminderTime := c.StartDate.Add(-time.Duration(c.ReminderOffset) * time.Minute).In(warsawLoc)

	log.Printf("📌 The event '%s' reminds us of %s ", c.Title, reminderTime)

	if err := db.Create(c).Error; err != nil {
		return nil, err
	}

	return &CalendarEvent{
		ID:             c.ID,
		Title:          c.Title,
		Description:    c.Description,
		StartDate:      c.StartDate.In(warsawLoc),
		EndDate:        c.EndDate.In(warsawLoc),
		AllDay:         c.AllDay,
		ReminderOffset: c.ReminderOffset,
		Color:          c.Color,
		WorkingDay:     c.WorkingDay,
		SickDay:        c.SickDay,
		Vacation:       c.Vacation,
		Weekend:        c.Weekend,
		SendMail:       c.SendEmail,
		ReminderSent:   c.ReminderSent,
		UserID:         c.UserID,
	}, nil
}

func GetAllEvents(db *gorm.DB, userId uuid.UUID) ([]CalendarEvent, error) {
	var events []entities.Calendar
	var response []CalendarEvent

	err := db.Where("user_id =?", userId).Find(&events).Error
	if err != nil {
		return nil, err
	}

	if len(events) == 0 {
		return []CalendarEvent{}, nil
	}
	warsawLoc, err := time.LoadLocation("Europe/Warsaw")
	if err != nil {
		log.Fatal(err)
	}

	for _, event := range events {
		response = append(response, CalendarEvent{
			ID:             event.ID,
			Title:          event.Title,
			Description:    event.Description,
			StartDate:      event.StartDate.In(warsawLoc),
			EndDate:        event.EndDate.In(warsawLoc),
			ReminderOffset: event.ReminderOffset,
			AllDay:         event.AllDay,
			Color:          event.Color,
			WorkingDay:     event.WorkingDay,
			SickDay:        event.SickDay,
			Vacation:       event.Vacation,
			Weekend:        event.Weekend,
			SendMail:       event.SendEmail,
			ReminderSent:   event.ReminderSent,
			UserID:         event.UserID,
		})
	}
	return response, nil
}

func GetEventById(db *gorm.DB, eventId uuid.UUID) (*CalendarEvent, error) {
	var calendar entities.Calendar

	err := repository.GetByID(db, eventId, &calendar)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("event not found")
		}
		return nil, err
	}
	return &CalendarEvent{
		ID:             calendar.ID,
		Title:          calendar.Title,
		Description:    calendar.Description,
		StartDate:      calendar.StartDate.UTC(),
		EndDate:        calendar.EndDate.UTC(),
		ReminderOffset: calendar.ReminderOffset,
		AllDay:         calendar.AllDay,
		Color:          calendar.Color,
		WorkingDay:     calendar.WorkingDay,
		SickDay:        calendar.SickDay,
		Vacation:       calendar.Vacation,
		Weekend:        calendar.Weekend,
		SendMail:       calendar.SendEmail,
		ReminderSent:   calendar.ReminderSent,
		UserID:         calendar.UserID,
	}, nil
}

func CalendarUpdateEvent(db *gorm.DB, eventId uuid.UUID, eventUpdate *CalendarEventUpdate) (*CalendarEvent, error) {
	var event entities.Calendar

	err := repository.GetByID(db, eventId, &event)
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
	if eventUpdate.ReminderOffset != 0 {
		event.ReminderOffset = eventUpdate.ReminderOffset
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

	err = db.Save(&event).Error
	if err != nil {
		return nil, err
	}
	warsawLoc, err := time.LoadLocation("Europe/Warsaw")
	if err != nil {
		log.Fatal(err)
	}
	return &CalendarEvent{
		ID:             event.ID,
		Title:          event.Title,
		Description:    event.Description,
		StartDate:      event.StartDate.In(warsawLoc),
		EndDate:        event.EndDate.In(warsawLoc),
		ReminderOffset: event.ReminderOffset,
		AllDay:         event.AllDay,
		Color:          event.Color,
		WorkingDay:     event.WorkingDay,
		SickDay:        event.SickDay,
		Vacation:       event.Vacation,
		Weekend:        event.Weekend,
		SendMail:       event.SendEmail,
		ReminderSent:   event.ReminderSent,
		UserID:         event.UserID,
	}, nil
}

func DeleteEventById(db *gorm.DB, eventId uuid.UUID) error {
	err := repository.DeleteByID(db, eventId, &entities.Calendar{})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("event not found")
		}
		return err
	}
	return nil
}

func GetUpcomingReminders(db *gorm.DB) ([]entities.Calendar, error) {
	var upcomingEvents []entities.Calendar
	now := time.Now().UTC()

	//log.Printf("🕒 Локальний час сервера: %v", now)
	//log.Printf("🌍 UTC час сервера: %v", now.UTC())

	err := db.
		Where("start_date - (INTERVAL '1 minute' * reminder_offset) <= ? AND reminder_sent = false AND send_email = true", now).
		Find(&upcomingEvents).Error

	if err != nil {
		log.Printf("❌ Database query error: %v", err)
		return nil, err
	}

	log.Printf("📋 Found %d events for reminder", len(upcomingEvents))
	return upcomingEvents, nil
}

// MarkReminderSent Позначити подію як відправлену
func MarkReminderSent(db *gorm.DB, eventID uuid.UUID) error {
	return db.Model(&entities.Calendar{}).
		Where("id = ?", eventID).
		Update("reminder_sent", true).Error
}
