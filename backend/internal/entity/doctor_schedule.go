package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DoctorSchedule struct {
	ID          uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	DoctorID    uuid.UUID      `gorm:"type:uuid;not null" json:"doctor_id"`
	DayOfWeek   int            `gorm:"not null" json:"day_of_week"` // 0=Sunday, 6=Saturday
	StartTime   string         `gorm:"type:varchar(5);not null" json:"start_time"` // "08:00"
	EndTime     string         `gorm:"type:varchar(5);not null" json:"end_time"`   // "17:00"
	MaxPatient  int            `gorm:"default:20" json:"max_patient"`
	IsActive    bool           `gorm:"default:true" json:"is_active"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	Doctor *Doctor `gorm:"foreignKey:DoctorID" json:"doctor,omitempty"`
}

func (DoctorSchedule) DayName(day int) string {
	days := []string{"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"}
	if day < 0 || day > 6 {
		return "Unknown"
	}
	return days[day]
}
