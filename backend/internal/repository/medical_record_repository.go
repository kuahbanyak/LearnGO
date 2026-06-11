package repository

import (
	"mediqueue/internal/entity"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MedicalRecordRepository interface {
	Create(record *entity.MedicalRecord) error
	Update(record *entity.MedicalRecord) error
	ReplacePrescriptions(recordID uuid.UUID, prescriptions []entity.Prescription) error
	FindByID(id uuid.UUID) (*entity.MedicalRecord, error)
	FindByPatientID(patientID uuid.UUID, limit, offset int) ([]entity.MedicalRecord, int64, error)
	FindByDoctorID(doctorID uuid.UUID, limit, offset int) ([]entity.MedicalRecord, int64, error)
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

func (r *medicalRecordRepository) Update(record *entity.MedicalRecord) error {
	return r.db.Save(record).Error
}

func (r *medicalRecordRepository) ReplacePrescriptions(recordID uuid.UUID, prescriptions []entity.Prescription) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Delete existing prescriptions
		if err := tx.Where("medical_record_id = ?", recordID).Delete(&entity.Prescription{}).Error; err != nil {
			return err
		}
		// Insert new prescriptions
		if len(prescriptions) > 0 {
			return tx.Create(&prescriptions).Error
		}
		return nil
	})
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

func (r *medicalRecordRepository) FindByDoctorID(doctorID uuid.UUID, limit, offset int) ([]entity.MedicalRecord, int64, error) {
	var records []entity.MedicalRecord
	var total int64

	r.db.Model(&entity.MedicalRecord{}).Where("doctor_id = ?", doctorID).Count(&total)
	err := r.db.Where("doctor_id = ?", doctorID).
		Preload("Patient.User").Preload("Prescriptions").Preload("Appointment").
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
