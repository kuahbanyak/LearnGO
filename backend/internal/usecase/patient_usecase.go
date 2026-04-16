package usecase

import (
	"errors"
	"time"

	"mediqueue/internal/dto"
	"mediqueue/internal/entity"
	"mediqueue/internal/repository"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PatientUsecase interface {
	GetAll(limit, offset int, search string) ([]entity.Patient, int64, error)
	GetByID(id uuid.UUID) (*entity.Patient, error)
	GetByUserID(userID uuid.UUID) (*entity.Patient, error)
	Update(userID uuid.UUID, req *dto.UpdatePatientRequest) (*entity.Patient, error)
}

type patientUsecase struct {
	patientRepo repository.PatientRepository
}

func NewPatientUsecase(patientRepo repository.PatientRepository) PatientUsecase {
	return &patientUsecase{patientRepo: patientRepo}
}

func (u *patientUsecase) GetAll(limit, offset int, search string) ([]entity.Patient, int64, error) {
	return u.patientRepo.FindAll(limit, offset, search)
}

func (u *patientUsecase) GetByID(id uuid.UUID) (*entity.Patient, error) {
	patient, err := u.patientRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("patient not found")
		}
		return nil, err
	}
	return patient, nil
}

func (u *patientUsecase) GetByUserID(userID uuid.UUID) (*entity.Patient, error) {
	return u.patientRepo.FindByUserID(userID)
}

func (u *patientUsecase) Update(userID uuid.UUID, req *dto.UpdatePatientRequest) (*entity.Patient, error) {
	patient, err := u.patientRepo.FindByUserID(userID)
	if err != nil {
		return nil, errors.New("patient profile not found")
	}

	if req.NIK != "" {
		patient.NIK = req.NIK
	}
	if req.DateOfBirth != "" {
		dob, err := time.Parse("2006-01-02", req.DateOfBirth)
		if err != nil {
			return nil, errors.New("invalid date format. Use YYYY-MM-DD")
		}
		patient.DateOfBirth = &dob
	}
	if req.Gender != "" {
		patient.Gender = entity.Gender(req.Gender)
	}
	if req.Address != "" {
		patient.Address = req.Address
	}
	if req.BloodType != "" {
		patient.BloodType = entity.BloodType(req.BloodType)
	}
	if req.Allergies != "" {
		patient.Allergies = req.Allergies
	}

	if err := u.patientRepo.Update(patient); err != nil {
		return nil, errors.New("failed to update patient data")
	}

	return patient, nil
}
