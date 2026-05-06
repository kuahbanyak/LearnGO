package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CheckInToken stores temporary tokens for QR-based check-in
type CheckInToken struct {
	ID             uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	AppointmentID  uuid.UUID      `gorm:"type:uuid;not null;uniqueIndex" json:"appointment_id"`
	Token          string         `gorm:"type:varchar(64);uniqueIndex;not null" json:"token"`
	ExpiresAt      time.Time      `gorm:"not null" json:"expires_at"`
	UsedAt         *time.Time     `json:"used_at,omitempty"`
	CreatedAt      time.Time      `json:"created_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	Appointment *Appointment `gorm:"foreignKey:AppointmentID" json:"appointment,omitempty"`
}
