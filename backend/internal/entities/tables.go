package entities

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

type Tenant struct {
	ID         uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Name       string    `gorm:"unique;not null" json:"name"`
	Domain     string    `gorm:"unique;not null" json:"domain"`
	DBHost     string    `json:"db_host"`
	DBPort     string    `json:"db_port"`
	DBUser     string    `json:"db_user"`
	DBPassword string    `json:"db_password"`
	DBName     string    `json:"db_name"`
	Migrated   bool      `gorm:"default:false" json:"migrated"`
	Status     bool      `gorm:"default:false" json:"status"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

func (attempt *Tenant) BeforeCreate(*gorm.DB) error {
	if attempt.ID == uuid.Nil {
		attempt.ID = uuid.New()
	}
	return nil
}

type LoginAttempt struct {
	ID          uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Email       string     `gorm:"not null" json:"email"`
	IP          string     `gorm:"not null" json:"ip"`
	Attempts    int        `gorm:"default:0" json:"attempts"`
	LastAttempt time.Time  `gorm:"not null" json:"last_attempt"`
	BannedUntil *time.Time `json:"banned_until"`
	CreatedAt   time.Time  `gorm:"not null" json:"created_at"`
	UpdatedAt   time.Time  `gorm:"not null" json:"updated_at"`
}

func (attempt *LoginAttempt) BeforeCreate(*gorm.DB) error {
	if attempt.ID == uuid.Nil {
		attempt.ID = uuid.New()
	}
	return nil
}
