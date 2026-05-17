package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID           uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Username     string         `gorm:"uniqueIndex;not null" json:"username"`
	Email        string         `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash string         `gorm:"not null" json:"-"`
	RoleID       uuid.UUID      `gorm:"type:uuid;not null" json:"role_id"`
	IsActive     bool           `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	Role    *Role    `gorm:"foreignKey:RoleID" json:"role,omitempty"`
	Patient *Patient `gorm:"foreignKey:UserID" json:"patient,omitempty"`
	Doctor  *Doctor  `gorm:"foreignKey:UserID" json:"doctor,omitempty"`
}

func (u *User) GetRoleName() string {
	if u.Role != nil {
		return u.Role.RoleName
	}
	return ""
}

func IsAdmin(u *User) bool {
	return u.GetRoleName() == "Admin"
}

func IsDoctor(u *User) bool {
	return u.GetRoleName() == "Doctor"
}

func IsPatient(u *User) bool {
	return u.GetRoleName() == "Patient"
}
