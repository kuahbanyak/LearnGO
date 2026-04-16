package repository

import (
	"mediqueue/internal/entity"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MedicalRecordRepository interface {
	Create(record *entity.MedicalRecord) error
	FindByID(id uuid.UUID) (*entity.MedicalRecord, error)
	FindByPatientID(patientID uuid.UUID, limit, offset int) ([]entity.MedicalRecord, int64, error)
	FindByAppointmentID(appointmentID uuid.UUID) (*entity.MedicalRecord, error)
}

type medicalRecordRepository struct {
	db *gorm.DB
}

func NewMedicalRecordRepository(db *gorm.DB) MedicalRecordRepository {
	return &medicalRecordRepository{db: db}
}

func (r *medicalRecordRepository) Create(record *entity.MedicalRecord) error {
	return r.db.Create(record).Error
}

func (r *medicalRecordRepository) FindByID(id uuid.UUID) (*entity.MedicalRecord, error) {
	var record entity.MedicalRecord
	err := r.db.Preload("Patient.User").Preload("Doctor.User").
		Preload("Appointment").Preload("Prescriptions").
		First(&record, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &record, nil
}

func (r *medicalRecordRepository) FindByPatientID(patientID uuid.UUID, limit, offset int) ([]entity.MedicalRecord, int64, error) {
	var records []entity.MedicalRecord
	var total int64

	r.db.Model(&entity.MedicalRecord{}).Where("patient_id = ?", patientID).Count(&total)
	err := r.db.Where("patient_id = ?", patientID).
		Preload("Doctor.User").Preload("Prescriptions").Preload("Appointment").
		Order("created_at DESC").Limit(limit).Offset(offset).Find(&records).Error
	return records, total, err
}

func (r *medicalRecordRepository) FindByAppointmentID(appointmentID uuid.UUID) (*entity.MedicalRecord, error) {
	var record entity.MedicalRecord
	err := r.db.Preload("Prescriptions").
		Where("appointment_id = ?", appointmentID).First(&record).Error
	if err != nil {
		return nil, err
	}
	return &record, nil
}
