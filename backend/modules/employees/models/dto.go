package models

import (
	"github.com/google/uuid"
	"gorm.io/datatypes"
	"time"
)

type UserResponseEmployees struct {
	ID          uuid.UUID `json:"ID"`
	FullName    string    `json:"fullName"`
	Avatar      string    `json:"avatar"`
	Email       string    `json:"email"`
	IsActive    bool      `json:"isActive"`
	IsSuperUser bool      `json:"isSuperUser"`
	IsAdmin     bool      `json:"isAdmin"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Додаткові поля з Employees
	PhoneNumber1      string         `json:"phone_number_1"`
	PhoneNumber2      string         `json:"phone_number_2"`
	Company           string         `json:"company"`
	Position          string         `json:"position"`
	ConditionType     string         `json:"condition_type"`
	Salary            string         `json:"salary"`
	Address           string         `json:"address"`
	DateStart         *time.Time     `json:"date_start"`
	DateEnd           *time.Time     `json:"date_end"`
	ExtraData         datatypes.JSON `json:"extra_data"`
	WhuCreatedByID    uuid.UUID      `json:"whu_created_by_id"`
	WhuCreatedByAcron string         `json:"whu_created_by_acron"`
	WhuUpdatedByID    *uuid.UUID     `json:"whu_updated_by_id"`
	WhuUpdatedByAcron *string        `json:"whu_updated_by_acron"`
}

type UpdateUserEmployees struct {
	FullName    *string `json:"fullName"`
	Avatar      *string `json:"avatar"`
	Email       *string `json:"email"`
	IsActive    *bool   `json:"isActive"`
	IsSuperUser *bool   `json:"isSuperUser"`
	IsAdmin     *bool   `json:"isAdmin"`
	Acronym     *string `json:"acronym"`

	// Додаткові поля з Employees
	PhoneNumber1  *string         `json:"phone_number_1"`
	PhoneNumber2  *string         `json:"phone_number_2"`
	Company       *string         `json:"company"`
	Position      *string         `json:"position"`
	ConditionType *string         `json:"condition_type"`
	Salary        *string         `json:"salary"`
	Address       *string         `json:"address"`
	DateStart     *time.Time      `json:"date_start"`
	DateEnd       *time.Time      `json:"date_end"`
	ExtraData     *datatypes.JSON `json:"extra_data"`
}
