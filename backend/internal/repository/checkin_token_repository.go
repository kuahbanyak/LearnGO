package repository

import (
	"mediqueue/internal/entity"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type CheckInTokenRepository interface {
	Create(token *entity.CheckInToken) error
	FindByToken(token string) (*entity.CheckInToken, error)
	FindByAppointmentID(appointmentID uuid.UUID) (*entity.CheckInToken, error)
	MarkUsed(token string, usedAt time.Time) error
	DeleteExpired() error
}

type checkInTokenRepository struct {
	db *gorm.DB
}

func NewCheckInTokenRepository(db *gorm.DB) CheckInTokenRepository {
	return &checkInTokenRepository{db: db}
}

func (r *checkInTokenRepository) Create(token *entity.CheckInToken) error {
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "appointment_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"token", "expires_at", "used_at"}),
	}).Create(token).Error
}

func (r *checkInTokenRepository) FindByToken(token string) (*entity.CheckInToken, error) {
	var t entity.CheckInToken
	err := r.db.Where("token = ?", token).Preload("Appointment").First(&t).Error
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *checkInTokenRepository) FindByAppointmentID(appointmentID uuid.UUID) (*entity.CheckInToken, error) {
	var t entity.CheckInToken
	err := r.db.Where("appointment_id = ?", appointmentID).First(&t).Error
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *checkInTokenRepository) MarkUsed(token string, usedAt time.Time) error {
	return r.db.Model(&entity.CheckInToken{}).
		Where("token = ?", token).
		Update("used_at", usedAt).Error
}

func (r *checkInTokenRepository) DeleteExpired() error {
	return r.db.Where("expires_at < ?", time.Now()).Delete(&entity.CheckInToken{}).Error
}
