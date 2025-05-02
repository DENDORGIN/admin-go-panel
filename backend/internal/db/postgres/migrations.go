package postgres

import (
	"backend/internal/entities"
	"backend/modules/user/models"
	"log"
)

func InitAdminDB() {
	var err error

	// Підключення до бази даних
	err = Connect()
	if err != nil {
		log.Fatalf("Failed to connect to the database: %v", err)
	}

	log.Println("Successfully connected to the database")
	db := GetDB()

	// Виконання міграцій для таблиць
	err = db.AutoMigrate(&models.User{}, &entities.Tenant{}, &entities.LoginAttempt{})
	if err != nil {
		log.Fatalf("Failed to migrate: %v", err)
	}

}
