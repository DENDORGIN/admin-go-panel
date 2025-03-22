package models

import (
	"backend/internal/adminpanel/db/postgres"
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/repository"
	"backend/internal/adminpanel/services/utils"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserResponse struct {
	ID          uuid.UUID `json:"ID"`
	FullName    string    `json:"fullName"`
	Avatar      string    `json:"avatar"`
	Email       string    `json:"email"`
	IsActive    bool      `json:"isActive"`
	IsSuperUser bool      `json:"isSuperUser"`

	Calendar []entities.Calendar `gorm:"foreignKey:UserID" json:"calendars"`
	Blog     []entities.Blog     `gorm:"foreignKey:OwnerID" json:"blogs"`
}

type AllUsers struct {
	Data  []*UserResponse `json:"data"`
	Count int             `json:"count"`
}

type UpdateUser struct {
	FullName string `json:"fullName,omitempty"`
	Email    string `json:"email,omitempty"`
}

type UpdatePassword struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
}

func CreateUser(user *entities.User) (*UserResponse, error) {
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

func GetAllUsers(ctx *gin.Context, limit int, skip int) ([]*entities.User, error) {
	var users []*entities.User
	if err := postgres.DB.Limit(limit).Offset(skip).Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

func GetUserById(db *gorm.DB, id uuid.UUID) (*UserResponse, error) {
	var user entities.User
	err := repository.GetByID(db, id, &user)
	if err != nil {
		return nil, err
	}

	// Формуємо структуру UserResponse
	userResponse := &UserResponse{
		ID:          user.ID,
		FullName:    user.FullName,
		Avatar:      user.Avatar,
		Email:       user.Email,
		IsActive:    user.IsActive,
		IsSuperUser: user.IsSuperUser,
	}
	return userResponse, nil
}

func GetUserByIdFull(id uuid.UUID) (*entities.User, error) {
	var user entities.User
	err := repository.GetByID(postgres.DB, id, &user)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func GetUserByEmail(db *gorm.DB, email string) (*entities.User, error) {
	var user entities.User
	result := db.Where("email = ?", email).First(&user)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	return &user, nil
}

func UpdateUserById(id uuid.UUID, updateUser *UpdateUser) (*UserResponse, error) {
	user, err := GetUserByIdFull(id)
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
	user, err := GetUserByIdFull(id)
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

func ResetCurrentUserPassword(db *gorm.DB, email string, password string) (string, error) {
	user, err := GetUserByEmail(db, email)
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

	err := repository.DeleteByID(postgres.DB, id, &entities.User{})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("user not found")
		}
	}
	return nil
}

func TransformUsers(users []*entities.User) []*UserResponse {
	var userResponses []*UserResponse
	for _, user := range users {
		userResponse := &UserResponse{
			ID:          user.ID,
			FullName:    user.FullName,
			Avatar:      user.Avatar,
			Email:       user.Email,
			IsActive:    user.IsActive,
			IsSuperUser: user.IsSuperUser,
		}
		userResponses = append(userResponses, userResponse)
	}
	return userResponses
}
