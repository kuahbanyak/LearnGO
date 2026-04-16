package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AppointmentStatus string

const (
	StatusWaiting    AppointmentStatus = "waiting"
	StatusInProgress AppointmentStatus = "in_progress"
	StatusCompleted  AppointmentStatus = "completed"
	StatusCancelled  AppointmentStatus = "cancelled"
)

type Appointment struct {
	ID              uuid.UUID         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	PatientID       uuid.UUID         `gorm:"type:uuid;not null" json:"patient_id"`
	DoctorID        uuid.UUID         `gorm:"type:uuid;not null" json:"doctor_id"`
	ScheduleID      uuid.UUID         `gorm:"type:uuid;not null" json:"schedule_id"`
	AppointmentDate time.Time         `gorm:"not null" json:"appointment_date"`
	QueueNumber     int               `gorm:"not null" json:"queue_number"`
	Status          AppointmentStatus `gorm:"type:varchar(20);default:'waiting'" json:"status"`
	CancelReason    string            `gorm:"type:text" json:"cancel_reason,omitempty"`
	CheckedInAt     *time.Time        `json:"checked_in_at,omitempty"`
	CompletedAt     *time.Time        `json:"completed_at,omitempty"`
	CreatedAt       time.Time         `json:"created_at"`
	UpdatedAt       time.Time         `json:"updated_at"`
	DeletedAt       gorm.DeletedAt    `gorm:"index" json:"-"`

	// Relations
	Patient       *Patient        `gorm:"foreignKey:PatientID" json:"patient,omitempty"`
	Doctor        *Doctor         `gorm:"foreignKey:DoctorID" json:"doctor,omitempty"`
	Schedule      *DoctorSchedule `gorm:"foreignKey:ScheduleID" json:"schedule,omitempty"`
	MedicalRecord *MedicalRecord  `gorm:"foreignKey:AppointmentID" json:"medical_record,omitempty"`
}
