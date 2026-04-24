package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Role string

const (
	RoleAdmin   Role = "admin"
	RoleDoctor  Role = "doctor"
	RolePatient Role = "patient"
)

type User struct {
	ID           uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Email        string         `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash string         `gorm:"not null" json:"-"`
	Role         Role           `gorm:"type:varchar(20);not null;default:'patient'" json:"role"`
	FullName     string         `gorm:"not null" json:"full_name"`
	Phone        string         `gorm:"type:varchar(20)" json:"phone"`
	NIK          string         `gorm:"type:varchar(16);uniqueIndex" json:"nik"`
	Gender       string         `gorm:"type:varchar(10)" json:"gender"`
	Address      string         `gorm:"type:text" json:"address"`
	BloodType    string         `gorm:"type:varchar(3)" json:"blood_type"`
	IsActive     bool           `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	Patient *Patient `gorm:"foreignKey:UserID" json:"patient,omitempty"`
	Doctor  *Doctor  `gorm:"foreignKey:UserID" json:"doctor,omitempty"`
}
