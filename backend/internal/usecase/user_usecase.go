package usecase

import (
	"errors"

	"mediqueue/internal/dto"
	"mediqueue/internal/repository"

	"github.com/google/uuid"
)

type UserUsecase interface {
	GetAll(limit, offset int) ([]dto.UserDetailResponse, int64, error)
	GetByID(id uuid.UUID) (*dto.UserDetailResponse, error)
	Update(id uuid.UUID, req *dto.UpdateUserRequest) (*dto.UserDetailResponse, error)
	Delete(id uuid.UUID) error
}

type userUsecase struct {
	userRepo repository.UserRepository
}

func NewUserUsecase(userRepo repository.UserRepository) UserUsecase {
	return &userUsecase{userRepo: userRepo}
}

func (u *userUsecase) GetAll(limit, offset int) ([]dto.UserDetailResponse, int64, error) {
	users, total, err := u.userRepo.FindAll(limit, offset)
	if err != nil {
		return nil, 0, err
	}

	var res []dto.UserDetailResponse
	for _, user := range users {
		userResp := dto.UserDetailResponse{
			ID:        user.ID,
			Username:  user.Username,
			Email:     user.Email,
			Role:      user.GetRoleName(),
			IsActive:  user.IsActive,
			CreatedAt: user.CreatedAt.Format("2006-01-02 15:04:05"),
			UpdatedAt: user.UpdatedAt.Format("2006-01-02 15:04:05"),
		}

		if user.Patient != nil {
			var dob *string
			if user.Patient.DateOfBirth != nil {
				d := user.Patient.DateOfBirth.Format("2006-01-02")
				dob = &d
			}
			userResp.Patient = &dto.PatientDTO{
				ID:          user.Patient.ID,
				FullName:    user.Patient.FullName,
				Phone:       user.Patient.Phone,
				NIK:         user.Patient.NIK,
				DateOfBirth: dob,
				Gender:      string(user.Patient.Gender),
				Address:     user.Patient.Address,
				BloodType:   string(user.Patient.BloodType),
				Allergies:   user.Patient.Allergies,
			}
		}

		if user.Doctor != nil {
			userResp.Doctor = &dto.DoctorDTO{
				ID:             user.Doctor.ID,
				FullName:       user.Doctor.FullName,
				Phone:          user.Doctor.Phone,
				Specialization: user.Doctor.Specialization,
				SIPNumber:      user.Doctor.SIPNumber,
			}
		}

		res = append(res, userResp)
	}
	return res, total, nil
}

func (u *userUsecase) GetByID(id uuid.UUID) (*dto.UserDetailResponse, error) {
	user, err := u.userRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("user not found")
	}

	userResp := &dto.UserDetailResponse{
		ID:        user.ID,
		Username:  user.Username,
		Email:     user.Email,
		Role:      user.GetRoleName(),
		IsActive:  user.IsActive,
		CreatedAt: user.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt: user.UpdatedAt.Format("2006-01-02 15:04:05"),
	}

	if user.Patient != nil {
		var dob *string
		if user.Patient.DateOfBirth != nil {
			d := user.Patient.DateOfBirth.Format("2006-01-02")
			dob = &d
		}
		userResp.Patient = &dto.PatientDTO{
			ID:          user.Patient.ID,
			FullName:    user.Patient.FullName,
			Phone:       user.Patient.Phone,
			NIK:         user.Patient.NIK,
			DateOfBirth: dob,
			Gender:      string(user.Patient.Gender),
			Address:     user.Patient.Address,
			BloodType:   string(user.Patient.BloodType),
			Allergies:   user.Patient.Allergies,
		}
	}

	if user.Doctor != nil {
		userResp.Doctor = &dto.DoctorDTO{
			ID:             user.Doctor.ID,
			FullName:       user.Doctor.FullName,
			Phone:          user.Doctor.Phone,
			Specialization: user.Doctor.Specialization,
			SIPNumber:      user.Doctor.SIPNumber,
		}
	}

	return userResp, nil
}

func (u *userUsecase) Update(id uuid.UUID, req *dto.UpdateUserRequest) (*dto.UserDetailResponse, error) {
	user, err := u.userRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if req.Username != "" {
		user.Username = req.Username
	}
	if req.Email != "" {
		user.Email = req.Email
	}
	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}

	if err := u.userRepo.Update(user); err != nil {
		return nil, errors.New("failed to update user")
	}

	return u.GetByID(id)
}

func (u *userUsecase) Delete(id uuid.UUID) error {
	_, err := u.userRepo.FindByID(id)
	if err != nil {
		return errors.New("user not found")
	}
	return u.userRepo.Delete(id)
}
