package repository

import (
	"mediqueue/internal/entity"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SymptomScreeningRepository interface {
	Create(screening *entity.SymptomScreening) error
	FindByAppointmentID(appointmentID uuid.UUID) (*entity.SymptomScreening, error)
	FindByPatientID(patientID uuid.UUID, limit, offset int) ([]entity.SymptomScreening, int64, error)
}

type symptomScreeningRepository struct {
	db *gorm.DB
}

func NewSymptomScreeningRepository(db *gorm.DB) SymptomScreeningRepository {
	return &symptomScreeningRepository{db: db}
}

func (r *symptomScreeningRepository) Create(screening *entity.SymptomScreening) error {
	return r.db.Create(screening).Error
}

func (r *symptomScreeningRepository) FindByAppointmentID(appointmentID uuid.UUID) (*entity.SymptomScreening, error) {
	var screening entity.SymptomScreening
	err := r.db.Where("appointment_id = ?", appointmentID).
		Preload("Appointment").
		Preload("Patient.User").
		First(&screening).Error
	if err != nil {
		return nil, err
	}
	return &screening, nil
}

func (r *symptomScreeningRepository) FindByPatientID(patientID uuid.UUID, limit, offset int) ([]entity.SymptomScreening, int64, error) {
	var screenings []entity.SymptomScreening
	var total int64

	r.db.Model(&entity.SymptomScreening{}).Where("patient_id = ?", patientID).Count(&total)

	err := r.db.Where("patient_id = ?", patientID).
		Preload("Appointment").
		Preload("Appointment.Doctor.User").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&screenings).Error

	return screenings, total, err
}
