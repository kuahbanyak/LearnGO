package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Doctor struct {
	ID             uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID         uuid.UUID      `gorm:"type:uuid;not null;uniqueIndex" json:"user_id"`
	Specialization string         `gorm:"not null" json:"specialization"`
	SIPNumber      string         `gorm:"uniqueIndex;type:varchar(50)" json:"sip_number"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	User      *User            `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Schedules []DoctorSchedule `gorm:"foreignKey:DoctorID" json:"schedules,omitempty"`
}
