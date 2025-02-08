package models

import (
	"backend/internal/adminpanel/db/postgres"
	"backend/internal/adminpanel/services/utils"
	"fmt"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"log"
	"time"
)

var db *gorm.DB

// User - модель користувача з UUID як primary key
type User struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	FullName    string    `gorm:"not null" json:"fullName"`
	Email       string    `gorm:"unique;not null" json:"email"`
	Password    string    `gorm:"not null" json:"password"`
	IsActive    bool      `gorm:"default:true" json:"isActive"`
	IsSuperUser bool      `gorm:"default:false" json:"isSuperUser"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type UserResponse struct {
	ID          uuid.UUID `json:"id"`
	FullName    string    `json:"fullName"`
	Email       string    `json:"email"`
	IsActive    bool      `json:"isActive"`
	IsSuperUser bool      `json:"isSuperUser"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// BeforeCreate - хук для автоматичної генерації UUID перед створенням запису
func (user *User) BeforeCreate(*gorm.DB) error {
	user.ID = uuid.New()
	return nil
}

func init() {
	var err error
	err = postgres.Connect()
	if err != nil {
		log.Fatalf("Failed to connect to the database: %v", err)
	}

	log.Println("Successfully connected to the database")
	db = postgres.GetDB()
	err = db.AutoMigrate(&User{})
	if err != nil {
		log.Fatalf("Failed to migrate: %v", err)
	}
}

func CreateUser(user *User) (*UserResponse, error) {
	if db == nil {
		return nil, fmt.Errorf("database connection is not initialized")
	}
	hashedPassword, err := utils.HashPassword(user.Password)
	if err != nil {
		return nil, err
	}
	user.Password = hashedPassword
	if err = db.Create(user).Error; err != nil {
		return nil, err
	}
	return &UserResponse{
		ID:          user.ID,
		FullName:    user.FullName,
		Email:       user.Email,
		IsActive:    user.IsActive,
		IsSuperUser: user.IsSuperUser,
	}, err
}

func GetUserById(id uuid.UUID) (*User, error) {
	var user User
	result := db.Where("id = ?", id).First(&user)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	return &user, nil
}

func GetUserByEmail(email string) (*User, error) {
	var user User
	result := db.Where("email = ?", email).First(&user)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	return &user, nil
}
