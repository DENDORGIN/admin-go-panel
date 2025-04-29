package models

import (
	"backend/internal/adminpanel/entities"
	"github.com/google/uuid"
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
