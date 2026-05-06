package repository

import (
	"mediqueue/internal/entity"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RatingRepository interface {
	Create(rating *entity.Rating) error
	FindByAppointmentID(appointmentID uuid.UUID) (*entity.Rating, error)
	FindByDoctorID(doctorID uuid.UUID, limit, offset int) ([]entity.Rating, int64, error)
	GetDoctorAverage(doctorID uuid.UUID) (float64, int64, error)
}

type ratingRepository struct {
	db *gorm.DB
}

func NewRatingRepository(db *gorm.DB) RatingRepository {
	return &ratingRepository{db: db}
}

func (r *ratingRepository) Create(rating *entity.Rating) error {
	return r.db.Create(rating).Error
}

func (r *ratingRepository) FindByAppointmentID(appointmentID uuid.UUID) (*entity.Rating, error) {
	var rating entity.Rating
	err := r.db.Where("appointment_id = ?", appointmentID).First(&rating).Error
	if err != nil {
		return nil, err
	}
	return &rating, nil
}

func (r *ratingRepository) FindByDoctorID(doctorID uuid.UUID, limit, offset int) ([]entity.Rating, int64, error) {
	var ratings []entity.Rating
	var total int64

	r.db.Model(&entity.Rating{}).Where("doctor_id = ?", doctorID).Count(&total)
	err := r.db.Where("doctor_id = ?", doctorID).
		Preload("Patient.User").
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&ratings).Error

	return ratings, total, err
}

func (r *ratingRepository) GetDoctorAverage(doctorID uuid.UUID) (float64, int64, error) {
	var result struct {
		Avg   float64 `gorm:"column:avg"`
		Count int64   `gorm:"column:count"`
	}

	err := r.db.Model(&entity.Rating{}).
		Select("COALESCE(AVG(score), 0) as avg, COUNT(*) as count").
		Where("doctor_id = ?", doctorID).
		Scan(&result).Error

	return result.Avg, result.Count, err
}
