package reminder

import (
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/models"
	"gorm.io/gorm"
	"log"
	"time"
)

func StartReminderJobs(db *gorm.DB) {
	go scheduleReminders(db)
	log.Println("✅ The reminder has been launched!")
}

func scheduleReminders(db *gorm.DB) {
	// Завантажуємо часовий пояс Варшави
	warsawLoc, err := time.LoadLocation("Europe/Warsaw")
	if err != nil {
		log.Fatal(err)
	}
	for {
		log.Println("🔄 Checking events...")

		time.Sleep(1 * time.Minute) // Перевіряємо кожну хвилину

		events, err := models.GetUpcomingReminders(db)
		if err != nil {
			log.Println("❌ Error receiving events:", err)
			continue
		}

		if len(events) == 0 {
			log.Println("✅ No events to remind you.")
			continue
		}

		for _, event := range events {
			reminderTime := event.StartDate.Add(-time.Duration(event.ReminderOffset) * time.Minute).In(warsawLoc)
			timeUntilReminder := time.Until(reminderTime)

			log.Printf("📌 Event '%s' should be reminded at %s (via %v)", event.Title, reminderTime, timeUntilReminder)

			scheduleReminder(db, event, reminderTime)
		}
	}
}

func scheduleReminder(db *gorm.DB, event entities.Calendar, reminderTime time.Time) {
	// Завантажуємо часовий пояс Варшави
	warsawLoc, err := time.LoadLocation("Europe/Warsaw")
	if err != nil {
		log.Fatal(err)
	}
	reminderTime = reminderTime.In(warsawLoc)
	timeUntilReminder := time.Until(reminderTime)

	log.Printf("🕒 The event '%s' is reminded by: %v (UTC)", event.Title, timeUntilReminder)

	if timeUntilReminder <= 0 {
		log.Printf("⚠️ Reminder time for event '%s' has expired! Execute immediately.", event.Title)
		go SendReminder(db, event)
		return
	}

	time.AfterFunc(timeUntilReminder, func() {
		SendReminder(db, event)
	})
}
