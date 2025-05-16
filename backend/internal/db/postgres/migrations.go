package postgres

import (
	"backend/internal/entities"
	"backend/internal/services/utils"
	blog "backend/modules/blog/models"
	calendar "backend/modules/calendar/models"
	messages "backend/modules/chat/messages/models"
	chatRooms "backend/modules/chat/rooms/models"
	directMessage "backend/modules/direct/models"
	employees "backend/modules/employees/models"
	item "backend/modules/item/models"
	media "backend/modules/media/models"
	property "backend/modules/property/models"
	reactions "backend/modules/reaction/models"
	user "backend/modules/user/models"

	"fmt"
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
	err = db.AutoMigrate(&user.User{}, &entities.Tenant{}, &entities.LoginAttempt{})
	if err != nil {
		log.Fatalf("Failed to migrate: %v", err)
	}
	fmt.Println("Successfully migrated the database")

}

func InitDB(ctx *gin.Context) {
	db, ok := utils.GetDBFromContext(ctx)
	if !ok {
		log.Println("Database not found in context")
		return
	}

	log.Println("Running tenant-specific migrations...")

	err := db.AutoMigrate(
		&user.User{},
		&employees.Employees{},
		&calendar.Calendar{},
		&blog.Blog{},
		&media.Media{},
		&item.Items{},
		&property.Property{},
		&chatRooms.ChatRooms{},
		&messages.Messages{},
		&directMessage.DirectMessage{},
		&directMessage.DirectChat{},
		&messages.MessageRead{},
		&reactions.Reaction{},
	)
	if err != nil {
		log.Fatalf("Failed to migrate: %v", err)
	}
}
