package usecase

import (
	"errors"

	"mediqueue/internal/dto"
	"mediqueue/internal/repository"

	"github.com/google/uuid"
)

type UserUsecase interface {
	GetAll(limit, offset int) ([]dto.UserResponse, int64, error)
	GetByID(id uuid.UUID) (*dto.UserResponse, error)
	Update(id uuid.UUID, req *dto.UpdateUserRequest) (*dto.UserResponse, error)
	Delete(id uuid.UUID) error
}

type userUsecase struct {
	userRepo repository.UserRepository
}

func NewUserUsecase(userRepo repository.UserRepository) UserUsecase {
	return &userUsecase{userRepo: userRepo}
}

func (u *userUsecase) GetAll(limit, offset int) ([]dto.UserResponse, int64, error) {
	users, total, err := u.userRepo.FindAll(limit, offset)
	if err != nil {
		return nil, 0, err
	}

	var res []dto.UserResponse
	for _, user := range users {
		res = append(res, dto.UserResponse{
			ID:        user.ID,
			Email:     user.Email,
			Role:      string(user.Role),
			FullName:  user.FullName,
			Phone:     user.Phone,
			NIK:       user.NIK,
			Gender:    user.Gender,
			Address:   user.Address,
			BloodType: user.BloodType,
			IsActive:  user.IsActive,
			CreatedAt: user.CreatedAt.Format("2006-01-02 15:04:05"),
			UpdatedAt: user.UpdatedAt.Format("2006-01-02 15:04:05"),
		})
	}
	return res, total, nil
}

func (u *userUsecase) GetByID(id uuid.UUID) (*dto.UserResponse, error) {
	user, err := u.userRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("user not found")
	}

	return &dto.UserResponse{
		ID:        user.ID,
		Email:     user.Email,
		Role:      string(user.Role),
		FullName:  user.FullName,
		Phone:     user.Phone,
		NIK:       user.NIK,
		Gender:    user.Gender,
		Address:   user.Address,
		BloodType: user.BloodType,
		IsActive:  user.IsActive,
		CreatedAt: user.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt: user.UpdatedAt.Format("2006-01-02 15:04:05"),
	}, nil
}

func (u *userUsecase) Update(id uuid.UUID, req *dto.UpdateUserRequest) (*dto.UserResponse, error) {
	user, err := u.userRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("user not found")
	}

	user.FullName = req.FullName
	user.Phone = req.Phone
	user.NIK = req.NIK
	if req.Gender != "" {
		user.Gender = req.Gender
	}
	if req.Address != "" {
		user.Address = req.Address
	}
	if req.BloodType != "" {
		user.BloodType = req.BloodType
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
