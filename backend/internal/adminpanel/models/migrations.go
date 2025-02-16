package models

import (
	"backend/internal/adminpanel/db/postgres"
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
	err = db.AutoMigrate(&User{}, &Calendar{}, &Blog{}, &Media{})
	if err != nil {
		log.Fatalf("Failed to migrate: %v", err)
	}
}
