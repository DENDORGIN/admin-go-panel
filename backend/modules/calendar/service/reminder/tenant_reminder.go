package reminder

import (
	postgres2 "backend/internal/db/postgres"
	"backend/internal/entities"
	"log"
)

func StartAllTenantReminderJobs() {
	adminDB := postgres2.GetDB()

	var tenants []entities.Tenant
	if err := adminDB.Find(&tenants).Error; err != nil {
		log.Println("❌ Failed to load tenants:", err)
		return
	}

	for _, tenant := range tenants {
		t := tenant
		go func(t entities.Tenant) {
			db, err := postgres2.Manager.GetConnectionByDomain(t.Domain)
			if err != nil {
				log.Printf("❌ DB error for tenant %s: %v", t.Domain, err)
				return
			}

			StartReminderJobs(db, t.Domain)
			log.Printf("✅ Reminder started for tenant: %s", t.Domain)
		}(t)
	}
}
