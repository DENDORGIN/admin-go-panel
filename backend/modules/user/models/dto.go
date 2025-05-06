package models

import (
	//blog "backend/modules/blog/models"
	"github.com/google/uuid"
	"gorm.io/datatypes"
	"time"
)

type UserResponse struct {
	ID          uuid.UUID `json:"ID"`
	FullName    string    `json:"fullName"`
	Avatar      string    `json:"avatar"`
	Email       string    `json:"email"`
	IsActive    bool      `json:"isActive"`
	IsSuperUser bool      `json:"isSuperUser"`
	IsAdmin     bool      `json:"isAdmin"`
}

type UserResponseEmployees struct {
	ID          uuid.UUID `json:"ID"`
	FullName    string    `json:"fullName"`
	Avatar      string    `json:"avatar"`
	Email       string    `json:"email"`
	IsActive    bool      `json:"isActive"`
	IsSuperUser bool      `json:"isSuperUser"`
	IsAdmin     bool      `json:"isAdmin"`

	// Додаткові поля з Employees
	PhoneNumber1  string         `json:"phone_number_1"`
	PhoneNumber2  string         `json:"phone_number_2"`
	Company       string         `json:"company"`
	Position      string         `json:"position"`
	ConditionType string         `json:"condition_type"`
	Salary        string         `json:"salary"`
	Address       string         `json:"address"`
	DateStart     *time.Time     `json:"date_start"`
	DateEnd       *time.Time     `json:"date_end"`
	ExtraData     datatypes.JSON `json:"extra_data"`
	WhuCreatedBy  uuid.UUID      `json:"whu_created_by"`
}

type AllUsers struct {
	Data  []*UserResponse `json:"data"`
	Count int             `json:"count"`
}

type UpdateUser struct {
	FullName string `json:"fullName,omitempty"`
	Email    string `json:"email,omitempty"`
	Avatar   string `json:"avatar"`
}

type UpdatePassword struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
}

type ResetPasswordRequest struct {
	Token       string `json:"token"`
	NewPassword string `json:"newPassword"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}
