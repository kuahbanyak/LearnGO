package repository

import (
	"time"

	"mediqueue/internal/entity"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AppointmentRepository interface {
	Create(appointment *entity.Appointment) error
	FindByID(id uuid.UUID) (*entity.Appointment, error)
	FindAll(limit, offset int, status, date string) ([]entity.Appointment, int64, error)
	FindByPatientID(patientID uuid.UUID, limit, offset int) ([]entity.Appointment, int64, error)
	FindByDoctorIDAndDate(doctorID uuid.UUID, date time.Time) ([]entity.Appointment, error)
	CountByScheduleAndDate(scheduleID uuid.UUID, date time.Time) (int64, error)
	NextQueueNumber(scheduleID uuid.UUID, date time.Time) (int, error)
	Update(appointment *entity.Appointment) error
}

type appointmentRepository struct {
	db *gorm.DB
}

func NewAppointmentRepository(db *gorm.DB) AppointmentRepository {
	return &appointmentRepository{db: db}
}

func (r *appointmentRepository) Create(appointment *entity.Appointment) error {
	return r.db.Create(appointment).Error
}

func (r *appointmentRepository) FindByID(id uuid.UUID) (*entity.Appointment, error) {
	var appointment entity.Appointment
	err := r.db.Preload("Patient.User").Preload("Doctor.User").Preload("Schedule").
		Preload("MedicalRecord.Prescriptions").First(&appointment, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &appointment, nil
}

func (r *appointmentRepository) FindAll(limit, offset int, status, date string) ([]entity.Appointment, int64, error) {
	var appointments []entity.Appointment
	var total int64

	query := r.db.Model(&entity.Appointment{}).
		Preload("Patient.User").Preload("Doctor.User").Preload("Schedule")

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if date != "" {
		query = query.Where("DATE(appointment_date) = ?", date)
	}

	query.Count(&total)
	err := query.Order("appointment_date, queue_number").
		Limit(limit).Offset(offset).Find(&appointments).Error
	return appointments, total, err
}

func (r *appointmentRepository) FindByPatientID(patientID uuid.UUID, limit, offset int) ([]entity.Appointment, int64, error) {
	var appointments []entity.Appointment
	var total int64

	r.db.Model(&entity.Appointment{}).Where("patient_id = ?", patientID).Count(&total)
	err := r.db.Where("patient_id = ?", patientID).
		Preload("Doctor.User").Preload("Schedule").Preload("MedicalRecord").
		Order("appointment_date DESC").Limit(limit).Offset(offset).Find(&appointments).Error
	return appointments, total, err
}

func (r *appointmentRepository) FindByDoctorIDAndDate(doctorID uuid.UUID, date time.Time) ([]entity.Appointment, error) {
	var appointments []entity.Appointment
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	err := r.db.Where("doctor_id = ? AND appointment_date >= ? AND appointment_date < ? AND status != ?",
		doctorID, startOfDay, endOfDay, entity.StatusCancelled).
		Preload("Patient.User").
		Order("queue_number").Find(&appointments).Error
	return appointments, err
}

func (r *appointmentRepository) CountByScheduleAndDate(scheduleID uuid.UUID, date time.Time) (int64, error) {
	var count int64
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	err := r.db.Model(&entity.Appointment{}).
		Where("schedule_id = ? AND appointment_date >= ? AND appointment_date < ? AND status != ?",
			scheduleID, startOfDay, endOfDay, entity.StatusCancelled).
		Count(&count).Error
	return count, err
}

func (r *appointmentRepository) NextQueueNumber(scheduleID uuid.UUID, date time.Time) (int, error) {
	var maxQueue int
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	r.db.Model(&entity.Appointment{}).
		Where("schedule_id = ? AND appointment_date >= ? AND appointment_date < ?",
			scheduleID, startOfDay, endOfDay).
		Select("COALESCE(MAX(queue_number), 0)").Scan(&maxQueue)

	return maxQueue + 1, nil
}

func (r *appointmentRepository) Update(appointment *entity.Appointment) error {
	return r.db.Save(appointment).Error
}
