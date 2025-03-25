package postgres

import (
	"backend/internal/adminpanel/entities"
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
	err = db.AutoMigrate(&entities.User{}, &entities.Tenant{})
	if err != nil {
		log.Fatalf("Failed to migrate: %v", err)
	}

}

func InitDB() {
	var err error

	// Підключення до бази даних
	err = Connect()
	if err != nil {
		log.Fatalf("Failed to connect to the database: %v", err)
	}

	log.Println("Successfully connected to the database")
	db := GetDB()

	// Виконання міграцій для всіх таблиць
	err = db.AutoMigrate(&entities.User{}, &entities.Calendar{},
		&entities.Blog{}, &entities.Media{},
		&entities.Items{}, &entities.Property{},
		&entities.ChatRooms{}, &entities.Messages{})
	if err != nil {
		log.Fatalf("Failed to migrate: %v", err)
	}
}
