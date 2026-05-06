package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Rating struct {
	ID            uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	AppointmentID uuid.UUID      `gorm:"type:uuid;not null;uniqueIndex" json:"appointment_id"`
	PatientID     uuid.UUID      `gorm:"type:uuid;not null" json:"patient_id"`
	DoctorID      uuid.UUID      `gorm:"type:uuid;not null" json:"doctor_id"`
	Score         int            `gorm:"not null;check:score >= 1 AND score <= 5" json:"score"`
	Comment       string         `gorm:"type:text" json:"comment,omitempty"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	Appointment *Appointment `gorm:"foreignKey:AppointmentID" json:"appointment,omitempty"`
	Patient     *Patient     `gorm:"foreignKey:PatientID" json:"patient,omitempty"`
	Doctor      *Doctor      `gorm:"foreignKey:DoctorID" json:"doctor,omitempty"`
}
