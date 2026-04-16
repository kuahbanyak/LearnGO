package repository

import (
	"mediqueue/internal/entity"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DoctorRepository interface {
	Create(doctor *entity.Doctor) error
	FindByID(id uuid.UUID) (*entity.Doctor, error)
	FindByUserID(userID uuid.UUID) (*entity.Doctor, error)
	FindAll(limit, offset int) ([]entity.Doctor, int64, error)
	Update(doctor *entity.Doctor) error
	Delete(id uuid.UUID) error
}

type doctorRepository struct {
	db *gorm.DB
}

func NewDoctorRepository(db *gorm.DB) DoctorRepository {
	return &doctorRepository{db: db}
}

func (r *doctorRepository) Create(doctor *entity.Doctor) error {
	return r.db.Create(doctor).Error
}

func (r *doctorRepository) FindByID(id uuid.UUID) (*entity.Doctor, error) {
	var doctor entity.Doctor
	err := r.db.Preload("User").Preload("Schedules").First(&doctor, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &doctor, nil
}

func (r *doctorRepository) FindByUserID(userID uuid.UUID) (*entity.Doctor, error) {
	var doctor entity.Doctor
	err := r.db.Preload("User").Preload("Schedules").Where("user_id = ?", userID).First(&doctor).Error
	if err != nil {
		return nil, err
	}
	return &doctor, nil
}

func (r *doctorRepository) FindAll(limit, offset int) ([]entity.Doctor, int64, error) {
	var doctors []entity.Doctor
	var total int64
	r.db.Model(&entity.Doctor{}).Count(&total)
	err := r.db.Preload("User").Preload("Schedules").
		Limit(limit).Offset(offset).Find(&doctors).Error
	return doctors, total, err
}

func (r *doctorRepository) Update(doctor *entity.Doctor) error {
	return r.db.Save(doctor).Error
}

func (r *doctorRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&entity.Doctor{}, "id = ?", id).Error
}
