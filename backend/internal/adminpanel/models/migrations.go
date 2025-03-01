package models

import (
	"backend/internal/adminpanel/db/postgres"
	"backend/internal/adminpanel/entities"
	"log"
)

func InitDB() {
	var err error

	// Підключення до бази даних
	err = postgres.Connect()
	if err != nil {
		log.Fatalf("Failed to connect to the database: %v", err)
	}

	log.Println("Successfully connected to the database")
	db := postgres.GetDB()

	// Виконання міграцій для всіх таблиць
	err = db.AutoMigrate(&entities.User{}, &entities.Calendar{}, &entities.Blog{}, &entities.Media{}, &entities.Items{}, &entities.Property{})
	if err != nil {
		log.Fatalf("Failed to migrate: %v", err)
	}
}
