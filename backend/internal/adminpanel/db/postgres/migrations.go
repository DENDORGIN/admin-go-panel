package postgres

import (
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/services/utils"
	"github.com/gin-gonic/gin"
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

func InitDB(ctx *gin.Context) {
	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		log.Println("Database not found in context")
		return
	}

	log.Println("Running tenant-specific migrations...")

	err := db.AutoMigrate(
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
		log.Fatalf("Failed to migrate: %v", err)
	}
}
