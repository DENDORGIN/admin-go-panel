package reminder

import (
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/models"
	"backend/internal/adminpanel/services/utils"
	"backend/modules/user/repository"
	"fmt"
	"gorm.io/gorm"
	"log"
	"time"
)

func SendReminder(db *gorm.DB, event entities.Calendar) {
	user, err := repository.GetUserById(db, event.UserID)
	if err != nil {
		log.Printf("⚠️ Event '%s' has no user email, skipped.\n", event.Title)
		return
	}

	log.Printf("👤 Found user: %s (%s)", user.FullName, user.Email)

	warsawLoc, err := time.LoadLocation("Europe/Warsaw")
	if err != nil {
		log.Fatal(err)
	}

	subject := fmt.Sprintf("🔔 Reminder.: %s", event.Title)
	message := fmt.Sprintf(`
		<h3>Hello, %s!</h3>
		<p>We remind you that the event <strong>%s</strong> will begin <strong>%s</strong>.</p>
		<p>Details: %s</p>
		<hr>
		<p><em>This is an automated message. Do not reply to it.</em></p>`,
		user.FullName, event.Title, event.StartDate.In(warsawLoc).Format("02.01.2006 15:04"), event.Description,
	)

	err = utils.SendEmail(user.Email, subject, message, true)
	if err != nil {
		log.Printf("❌ Error sending email for an event '%s' (%s): %v\n", event.Title, user.Email, err)
		return
	}

	log.Printf("✅ A reminder has been sent: %s (%s)\n", event.Title, user.Email)

	// Позначаємо подію як "нагадування відправлено"
	err = models.MarkReminderSent(db, event.ID)
	if err != nil {
		log.Printf("❌ Event update error '%s': %v\n", event.Title, err)
	}
}
