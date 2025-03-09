package routes

import (
	"github.com/robfig/cron/v3"
	"log"
)

func StartCronJobs() {
	//c := cron.New(cron.WithSeconds()) // Додаємо підтримку секунд
	c := cron.New()

	_, err := c.AddFunc("0 * * * *", func() { // Кожні 60 секунд
		log.Println("🔔 Виконання нагадувань")
		SendReminders()
		log.Println("✅ SendReminders завершено")
	})

	if err != nil {
		log.Fatalf("❌ Не вдалося додати cron задачу: %v", err)
	}

	c.Start()
	log.Println("✅ CronJobs успішно запущено")
}
