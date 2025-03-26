package tenant

import (
	"backend/internal/adminpanel/db/postgres"
	"backend/internal/adminpanel/entities"
	"fmt"
	pg "gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func MigrateAllTenants() {
	ResetMigrationLog()

	adminDB := postgres.GetDB()

	var tenants []entities.Tenant
	if err := adminDB.Find(&tenants).Error; err != nil {
		logMigration(MigrationStatus{
			TenantName: "admin",
			Status:     "error",
			Message:    "failed to load tenants",
		})
		return
	}

	for _, tenant := range tenants {
		dsn := fmt.Sprintf(
			"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
			tenant.DBHost, tenant.DBPort, tenant.DBUser, tenant.DBPassword, tenant.DBName,
		)

		db, err := gorm.Open(pg.Open(dsn), &gorm.Config{})
		if err != nil {
			logMigration(MigrationStatus{
				TenantName: tenant.Name,
				Status:     "error",
				Message:    fmt.Sprintf("connection error: %v", err),
			})
			continue
		}

		err = db.AutoMigrate(
			&entities.User{},
			&entities.Calendar{},
			&entities.Blog{},
			&entities.Media{},
			&entities.Items{},
			&entities.Property{},
			&entities.ChatRooms{},
			&entities.Messages{},
			&entities.DirectMessage{},
			&entities.Conversations{},
		)
		if err != nil {
			logMigration(MigrationStatus{
				TenantName: tenant.Name,
				Status:     "error",
				Message:    err.Error(),
			})
		} else {
			logMigration(MigrationStatus{
				TenantName: tenant.Name,
				Status:     "ok",
			})
		}
	}
}
