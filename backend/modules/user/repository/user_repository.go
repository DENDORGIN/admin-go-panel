package repository

import (
	"backend/internal/repository"
	employees "backend/modules/employees/models"
	"backend/modules/user/models"
	"backend/modules/user/utils"
	"errors"
	"fmt"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func CreateUser(db *gorm.DB, user *models.User, createdByID uuid.UUID, createdByAcron string) (*models.UserResponse, error) {
	if db == nil {
		return nil, fmt.Errorf("database connection is not initialized")
	}
	hashedPassword, err := utils.HashPassword(user.Password)
	if err != nil {
		return nil, err
	}
	user.Password = hashedPassword
	if user.Avatar == "" {
		user.Avatar = "https://f003.backblazeb2.com/file/admin-go-panel/user.png"
	}

	err = db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(user).Error; err != nil {
			return err
		}

		employee := employees.Employees{
			ID:                uuid.New(),
			UserID:            user.ID,
			WhuCreatedByID:    createdByID,
			WhuCreatedByAcron: createdByAcron,
		}
		if err := tx.Create(&employee).Error; err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		return nil, err
	}
	return &models.UserResponse{
		ID:          user.ID,
		FullName:    user.FullName,
		Email:       user.Email,
		IsActive:    user.IsActive,
		IsSuperUser: user.IsSuperUser,
		IsAdmin:     user.IsAdmin,
		Acronym:     user.Acronym,
	}, err
}

func GetAllUsers(db *gorm.DB, limit int, skip int) ([]*models.User, error) {
	var users []*models.User
	if err := db.Limit(limit).Offset(skip).Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

func GetUserById(db *gorm.DB, id uuid.UUID) (*models.UserResponse, error) {
	var user models.User

	err := repository.GetByID(db, id, &user)
	if err != nil {
		return nil, err
	}

	// Формуємо відповідь
	UserResponse := &models.UserResponse{
		ID:          user.ID,
		FullName:    user.FullName,
		Avatar:      user.Avatar,
		Email:       user.Email,
		IsActive:    user.IsActive,
		IsSuperUser: user.IsSuperUser,
		IsAdmin:     user.IsAdmin,
		Acronym:     user.Acronym,
		LastSeenAt:  user.LastSeenAt,
	}
	return UserResponse, nil
}

func GetUserByIdFull(db *gorm.DB, id uuid.UUID) (*models.User, error) {
	var user models.User
	err := repository.GetByID(db, id, &user)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func GetUserByEmail(db *gorm.DB, email string) (*models.User, error) {
	var user models.User
	result := db.Where("email = ?", email).First(&user)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	return &user, nil
}

func UpdateUserById(db *gorm.DB, id uuid.UUID, updateUser *models.UpdateUser) (*models.UserResponse, error) {
	user, err := GetUserByIdFull(db, id)
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

	if updateUser.Avatar != "" {
		user.Avatar = updateUser.Avatar
	}

	if err = db.Save(&user).Error; err != nil {
		return nil, err
	}
	return &models.UserResponse{
		ID:          user.ID,
		FullName:    user.FullName,
		Email:       user.Email,
		Avatar:      user.Avatar,
		IsActive:    user.IsActive,
		IsSuperUser: user.IsSuperUser,
		IsAdmin:     user.IsAdmin,
		Acronym:     user.Acronym,
		LastSeenAt:  user.LastSeenAt,
	}, nil
}

func DeleteUserById(db *gorm.DB, id uuid.UUID) error {

	err := repository.DeleteByID(db, id, &models.User{})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("user not found")
		}
	}

	err = repository.DeleteByUserID(db, id, &employees.Employees{})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("employees not found")
		}
	}
	return nil
}
