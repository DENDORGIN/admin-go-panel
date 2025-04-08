package reminder

import (
	"backend/internal/adminpanel/db/postgres"
	"backend/internal/adminpanel/entities"
	"log"
)

func StartAllTenantReminderJobs() {
	adminDB := postgres.GetDB()

	var tenants []entities.Tenant
	if err := adminDB.Find(&tenants).Error; err != nil {
		log.Println("❌ Failed to load tenants:", err)
		return
	}

	for _, tenant := range tenants {
		go func(t entities.Tenant) {
			db, err := postgres.Manager.GetConnection(t)
			if err != nil {
				log.Printf("❌ DB error for tenant %s: %v", t.Domain, err)
				return
			}

			StartReminderJobs(db, t.Domain)
			log.Printf("✅ Reminder started for tenant: %s", t.Domain)
		}(tenant)
	}
}
