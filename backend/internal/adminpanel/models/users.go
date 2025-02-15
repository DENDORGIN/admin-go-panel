package models

import (
	"backend/internal/adminpanel/db/postgres"
	"backend/internal/adminpanel/services/utils"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"log"
	"time"
)

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

	Calendar []Calendar `gorm:"foreignKey:UserID" json:"calendars"`
	Blog     []Blog     `gorm:"foreignKey:AutorID" json:"blogs"`
}

type AllUsers struct {
	Data  []*UserResponse `json:"data"`
	Count int             `json:"count"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type UpdateUser struct {
	FullName string `json:"fullName,omitempty"`
	Email    string `json:"email,omitempty"`
}

type UpdatePassword struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
}

// BeforeCreate - хук для автоматичної генерації UUID перед створенням запису
func (user *User) BeforeCreate(*gorm.DB) error {
	user.ID = uuid.New()
	return nil
}

func CreateUser(user *User) (*UserResponse, error) {
	if postgres.DB == nil {
		return nil, fmt.Errorf("database connection is not initialized")
	}
	hashedPassword, err := utils.HashPassword(user.Password)
	if err != nil {
		return nil, err
	}
	user.Password = hashedPassword
	if err = postgres.DB.Create(user).Error; err != nil {
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

func GetAllUsers(ctx *gin.Context, limit int, skip int) ([]*User, error) {
	var users []*User
	if err := postgres.DB.Limit(limit).Offset(skip).Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

func GetUserById(id uuid.UUID) (*User, error) {
	var user User
	result := postgres.DB.Where("id = ?", id).First(&user)
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
	result := postgres.DB.Where("email = ?", email).First(&user)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	return &user, nil
}

func UpdateUserById(id uuid.UUID, updateUser *UpdateUser) (*UserResponse, error) {
	user, err := GetUserById(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	if updateUser.FullName != "" {
		user.FullName = updateUser.FullName
	}
	if updateUser.Email != "" {
		user.Email = updateUser.Email
	}

	if err = postgres.DB.Save(&user).Error; err != nil {
		return nil, err
	}
	return &UserResponse{
		ID:          user.ID,
		FullName:    user.FullName,
		Email:       user.Email,
		IsActive:    user.IsActive,
		IsSuperUser: user.IsSuperUser,
	}, nil
}

func UpdateCurrentUserPassword(id uuid.UUID, password *UpdatePassword) (string, error) {
	user, err := GetUserById(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", errors.New("user not found")
		}
		return "", err
	}

	if !utils.ComparePasswords(password.CurrentPassword, user.Password) {
		return "", errors.New("current password is incorrect")
	}
	if password.CurrentPassword == password.NewPassword {
		return "", errors.New("new password cannot be the same as the current one")
	}

	hashedPassword, err := utils.HashPassword(password.NewPassword)
	if err != nil {
		return "", err
	}

	user.Password = hashedPassword

	if err = postgres.DB.Save(&user).Error; err != nil {
		return "", err
	}

	return "update password successfully", nil
}

func ResetCurrentUserPassword(email string, password string) (string, error) {
	user, err := GetUserByEmail(email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", errors.New("user not found")
		}
		return "", err
	}

	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		return "", err
	}

	user.Password = hashedPassword

	if err = postgres.DB.Save(&user).Error; err != nil {
		return "", err
	}

	return "update password successfully", nil
}

func DeleteUserById(id uuid.UUID) error {
	result := postgres.DB.Where("id = ?", id).Delete(&User{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("user not found")
	}
	return nil
}

func GetCurrentUserIsSuperUser(id uuid.UUID) (bool, error) {
	user, err := GetUserById(id)
	if err != nil {
		log.Fatal(err)
	}
	return user.IsSuperUser, nil
}

func TransformUsers(users []*User) []*UserResponse {
	var userResponses []*UserResponse
	for _, user := range users {
		userResponse := &UserResponse{
			ID:          user.ID,
			FullName:    user.FullName,
			Email:       user.Email,
			IsActive:    user.IsActive,
			IsSuperUser: user.IsSuperUser,
		}
		userResponses = append(userResponses, userResponse)
	}
	return userResponses
}
