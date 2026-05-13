package database

import (
	"log"

	"mediqueue/pkg/logger"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

// CreateIndexes creates database indexes for performance optimization
func CreateIndexes(db *gorm.DB) error {
	logger.Info("Creating database indexes...")

	indexes := []struct {
		name  string
		query string
	}{
		// Users table indexes
		{"idx_users_email", "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)"},
		{"idx_users_role", "CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)"},
		{"idx_users_is_active", "CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active)"},

		// Patients table indexes
		{"idx_patients_user_id", "CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id)"},
		{"idx_patients_nik", "CREATE INDEX IF NOT EXISTS idx_patients_nik ON patients(nik) WHERE nik IS NOT NULL"},

		// Doctors table indexes
		{"idx_doctors_user_id", "CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id)"},
		{"idx_doctors_specialization", "CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization)"},

		// Appointments table indexes
		{"idx_appointments_patient_id", "CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id)"},
		{"idx_appointments_doctor_id", "CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id)"},
		{"idx_appointments_schedule_id", "CREATE INDEX IF NOT EXISTS idx_appointments_schedule_id ON appointments(schedule_id)"},
		{"idx_appointments_date", "CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date)"},
		{"idx_appointments_status", "CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status)"},
		
		// Composite indexes for common queries
		{"idx_appointments_date_status", "CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON appointments(appointment_date, status)"},
		{"idx_appointments_doctor_date", "CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, appointment_date)"},
		{"idx_appointments_doctor_date_status", "CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date_status ON appointments(doctor_id, appointment_date, status)"},
		{"idx_appointments_schedule_date", "CREATE INDEX IF NOT EXISTS idx_appointments_schedule_date ON appointments(schedule_id, appointment_date)"},

		// Doctor schedules indexes
		{"idx_schedules_doctor_id", "CREATE INDEX IF NOT EXISTS idx_schedules_doctor_id ON doctor_schedules(doctor_id)"},
		{"idx_schedules_day_of_week", "CREATE INDEX IF NOT EXISTS idx_schedules_day_of_week ON doctor_schedules(day_of_week)"},
		{"idx_schedules_is_active", "CREATE INDEX IF NOT EXISTS idx_schedules_is_active ON doctor_schedules(is_active)"},

		// Medical records indexes
		{"idx_medical_records_appointment_id", "CREATE INDEX IF NOT EXISTS idx_medical_records_appointment_id ON medical_records(appointment_id)"},
		{"idx_medical_records_patient_id", "CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id)"},
		{"idx_medical_records_doctor_id", "CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id ON medical_records(doctor_id)"},

		// Ratings indexes
		{"idx_ratings_doctor_id", "CREATE INDEX IF NOT EXISTS idx_ratings_doctor_id ON ratings(doctor_id)"},
		{"idx_ratings_patient_id", "CREATE INDEX IF NOT EXISTS idx_ratings_patient_id ON ratings(patient_id)"},
	}

	successCount := 0
	for _, idx := range indexes {
		if err := db.Exec(idx.query).Error; err != nil {
			logger.Error("Failed to create index", 
				zap.String("index", idx.name), 
				zap.Error(err))
			log.Printf("Warning: Failed to create index %s: %v", idx.name, err)
		} else {
			successCount++
			logger.Debug("Index created", zap.String("index", idx.name))
		}
	}

	logger.Info("Database indexes created", 
		zap.Int("success", successCount), 
		zap.Int("total", len(indexes)))
	log.Printf("Created %d/%d database indexes", successCount, len(indexes))

	return nil
}
