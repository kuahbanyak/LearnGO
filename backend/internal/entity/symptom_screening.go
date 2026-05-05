package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SymptomScreening stores patient pre-screening data
type SymptomScreening struct {
	ID              uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	AppointmentID   uuid.UUID      `gorm:"type:uuid;not null;uniqueIndex" json:"appointment_id"`
	PatientID       uuid.UUID      `gorm:"type:uuid;not null" json:"patient_id"`
	Symptoms        string         `gorm:"type:text;not null" json:"symptoms"` // JSON array stored as text
	Severity        string         `gorm:"type:varchar(20);not null" json:"severity"` // mild, moderate, severe
	AdditionalNotes string         `gorm:"type:text" json:"additional_notes"`
	Duration        string         `gorm:"type:varchar(100)" json:"duration"`
	Temperature     string         `gorm:"type:varchar(20)" json:"temperature"`
	AISummary       string         `gorm:"type:text" json:"ai_summary"` // AI-generated summary
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	Appointment *Appointment `gorm:"foreignKey:AppointmentID" json:"appointment,omitempty"`
	Patient     *Patient     `gorm:"foreignKey:PatientID" json:"patient,omitempty"`
}
