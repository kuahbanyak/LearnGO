package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MedicalRecord struct {
	ID            uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	AppointmentID uuid.UUID      `gorm:"type:uuid;not null;uniqueIndex" json:"appointment_id"`
	PatientID     uuid.UUID      `gorm:"type:uuid;not null" json:"patient_id"`
	DoctorID      uuid.UUID      `gorm:"type:uuid;not null" json:"doctor_id"`
	Complaint     string         `gorm:"type:text;not null" json:"complaint"`
	Diagnosis     string         `gorm:"type:text" json:"diagnosis"`
	ICDCode       string         `gorm:"type:varchar(20)" json:"icd_code"`
	ActionTaken   string         `gorm:"type:text" json:"action_taken"`
	DoctorNotes   string         `gorm:"type:text" json:"doctor_notes"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	Appointment   *Appointment   `gorm:"foreignKey:AppointmentID" json:"appointment,omitempty"`
	Patient       *Patient       `gorm:"foreignKey:PatientID" json:"patient,omitempty"`
	Doctor        *Doctor        `gorm:"foreignKey:DoctorID" json:"doctor,omitempty"`
	Prescriptions []Prescription `gorm:"foreignKey:MedicalRecordID" json:"prescriptions,omitempty"`
}

type Prescription struct {
	ID              uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	MedicalRecordID uuid.UUID      `gorm:"type:uuid;not null" json:"medical_record_id"`
	MedicineName    string         `gorm:"not null" json:"medicine_name"`
	Dosage          string         `gorm:"type:varchar(50)" json:"dosage"`
	Quantity        int            `json:"quantity"`
	UsageInstruction string        `gorm:"type:text" json:"usage_instruction"`
	Notes           string         `gorm:"type:text" json:"notes"`
	CreatedAt       time.Time      `json:"created_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}
