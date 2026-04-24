package repository

import (
	"mediqueue/internal/entity"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRepository interface {
	Create(user *entity.User) error
	FindByID(id uuid.UUID) (*entity.User, error)
	FindByEmail(email string) (*entity.User, error)
	FindAll(limit, offset int) ([]entity.User, int64, error)
	Update(user *entity.User) error
	Delete(id uuid.UUID) error
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(user *entity.User) error {
	return r.db.Create(user).Error
}

func (r *userRepository) FindByID(id uuid.UUID) (*entity.User, error) {
	var user entity.User
	err := r.db.Preload("Patient").Preload("Doctor").First(&user, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindByEmail(email string) (*entity.User, error) {
	var user entity.User
	err := r.db.Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindAll(limit, offset int) ([]entity.User, int64, error) {
	var users []entity.User
	var total int64

	db := r.db.Model(&entity.User{})
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if limit > 0 {
		db = db.Limit(limit)
	}
	if offset > 0 {
		db = db.Offset(offset)
	}

	if err := db.Preload("Patient").Preload("Doctor").Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

func (r *userRepository) Update(user *entity.User) error {
	return r.db.Save(user).Error
}

func (r *userRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&entity.User{}, "id = ?", id).Error
}
