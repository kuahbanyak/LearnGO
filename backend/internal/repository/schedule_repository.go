package repository

import (
	"mediqueue/internal/entity"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ScheduleRepository interface {
	Create(schedule *entity.DoctorSchedule) error
	FindByID(id uuid.UUID) (*entity.DoctorSchedule, error)
	FindByDoctorID(doctorID uuid.UUID) ([]entity.DoctorSchedule, error)
	FindAll() ([]entity.DoctorSchedule, error)
	FindActiveByDoctorAndDay(doctorID uuid.UUID, day int) (*entity.DoctorSchedule, error)
	Update(schedule *entity.DoctorSchedule) error
	Delete(id uuid.UUID) error
}

type scheduleRepository struct {
	db *gorm.DB
}

func NewScheduleRepository(db *gorm.DB) ScheduleRepository {
	return &scheduleRepository{db: db}
}

func (r *scheduleRepository) Create(schedule *entity.DoctorSchedule) error {
	return r.db.Create(schedule).Error
}

func (r *scheduleRepository) FindByID(id uuid.UUID) (*entity.DoctorSchedule, error) {
	var schedule entity.DoctorSchedule
	err := r.db.Preload("Doctor.User").First(&schedule, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &schedule, nil
}

func (r *scheduleRepository) FindByDoctorID(doctorID uuid.UUID) ([]entity.DoctorSchedule, error) {
	var schedules []entity.DoctorSchedule
	err := r.db.Where("doctor_id = ?", doctorID).Find(&schedules).Error
	return schedules, err
}

func (r *scheduleRepository) FindAll() ([]entity.DoctorSchedule, error) {
	var schedules []entity.DoctorSchedule
	err := r.db.Preload("Doctor.User").
		Order("day_of_week, start_time").Find(&schedules).Error
	return schedules, err
}

func (r *scheduleRepository) FindActiveByDoctorAndDay(doctorID uuid.UUID, day int) (*entity.DoctorSchedule, error) {
	var schedule entity.DoctorSchedule
	err := r.db.Where("doctor_id = ? AND day_of_week = ? AND is_active = true", doctorID, day).
		First(&schedule).Error
	if err != nil {
		return nil, err
	}
	return &schedule, nil
}

func (r *scheduleRepository) Update(schedule *entity.DoctorSchedule) error {
	return r.db.Save(schedule).Error
}

func (r *scheduleRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&entity.DoctorSchedule{}, "id = ?", id).Error
}
