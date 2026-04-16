package usecase

import (
	"errors"

	"mediqueue/internal/dto"
	"mediqueue/internal/entity"
	"mediqueue/internal/repository"
	"mediqueue/pkg/utils"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DoctorUsecase interface {
	Create(req *dto.CreateDoctorRequest) (*entity.Doctor, error)
	GetAll(limit, offset int) ([]entity.Doctor, int64, error)
	GetByID(id uuid.UUID) (*entity.Doctor, error)
	Update(id uuid.UUID, req *dto.UpdateDoctorRequest) (*entity.Doctor, error)
	Delete(id uuid.UUID) error
}

type doctorUsecase struct {
	doctorRepo repository.DoctorRepository
	userRepo   repository.UserRepository
}

func NewDoctorUsecase(doctorRepo repository.DoctorRepository, userRepo repository.UserRepository) DoctorUsecase {
	return &doctorUsecase{doctorRepo: doctorRepo, userRepo: userRepo}
}

func (u *doctorUsecase) Create(req *dto.CreateDoctorRequest) (*entity.Doctor, error) {
	existing, _ := u.userRepo.FindByEmail(req.Email)
	if existing != nil {
		return nil, errors.New("email already registered")
	}

	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, errors.New("failed to process password")
	}

	userID := uuid.New()
	user := &entity.User{
		ID:           userID,
		Email:        req.Email,
		PasswordHash: hash,
		Role:         entity.RoleDoctor,
		FullName:     req.FullName,
		Phone:        req.Phone,
		IsActive:     true,
	}
	if err := u.userRepo.Create(user); err != nil {
		return nil, errors.New("failed to create doctor account")
	}

	doctor := &entity.Doctor{
		ID:             uuid.New(),
		UserID:         userID,
		Specialization: req.Specialization,
		SIPNumber:      req.SIPNumber,
	}
	if err := u.doctorRepo.Create(doctor); err != nil {
		return nil, errors.New("failed to create doctor profile")
	}

	doctor.User = user
	return doctor, nil
}

func (u *doctorUsecase) GetAll(limit, offset int) ([]entity.Doctor, int64, error) {
	return u.doctorRepo.FindAll(limit, offset)
}

func (u *doctorUsecase) GetByID(id uuid.UUID) (*entity.Doctor, error) {
	doctor, err := u.doctorRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("doctor not found")
		}
		return nil, err
	}
	return doctor, nil
}

func (u *doctorUsecase) Update(id uuid.UUID, req *dto.UpdateDoctorRequest) (*entity.Doctor, error) {
	doctor, err := u.doctorRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("doctor not found")
	}

	if req.Specialization != "" {
		doctor.Specialization = req.Specialization
	}
	if req.SIPNumber != "" {
		doctor.SIPNumber = req.SIPNumber
	}

	// Update linked user
	if doctor.User != nil {
		if req.FullName != "" {
			doctor.User.FullName = req.FullName
		}
		if req.Phone != "" {
			doctor.User.Phone = req.Phone
		}
		_ = u.userRepo.Update(doctor.User)
	}

	if err := u.doctorRepo.Update(doctor); err != nil {
		return nil, errors.New("failed to update doctor")
	}

	return doctor, nil
}

func (u *doctorUsecase) Delete(id uuid.UUID) error {
	_, err := u.doctorRepo.FindByID(id)
	if err != nil {
		return errors.New("doctor not found")
	}
	return u.doctorRepo.Delete(id)
}
