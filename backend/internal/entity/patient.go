package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BloodType string
type Gender string

const (
	BloodTypeA  BloodType = "A"
	BloodTypeB  BloodType = "B"
	BloodTypeAB BloodType = "AB"
	BloodTypeO  BloodType = "O"

	GenderMale   Gender = "male"
	GenderFemale Gender = "female"
)

type Patient struct {
	ID          uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID      uuid.UUID      `gorm:"type:uuid;not null;uniqueIndex" json:"user_id"`
	NIK         string         `gorm:"uniqueIndex;type:varchar(16)" json:"nik"`
	DateOfBirth *time.Time     `json:"date_of_birth"`
	Gender      Gender         `gorm:"type:varchar(10)" json:"gender"`
	Address     string         `gorm:"type:text" json:"address"`
	BloodType   BloodType      `gorm:"type:varchar(3)" json:"blood_type"`
	Allergies   string         `gorm:"type:text" json:"allergies"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	User         *User         `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Appointments []Appointment `gorm:"foreignKey:PatientID" json:"appointments,omitempty"`
}
