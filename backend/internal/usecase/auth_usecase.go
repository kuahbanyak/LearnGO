package usecase

import (
	"errors"

	"mediqueue/internal/dto"
	"mediqueue/internal/entity"
	"mediqueue/internal/repository"
	"mediqueue/pkg/utils"

	"github.com/google/uuid"
)

type AuthUsecase interface {
	Register(req *dto.RegisterRequest) (*entity.User, error)
	Login(req *dto.LoginRequest, jwtExpiryHours int) (string, *entity.User, error)
	GetProfile(userID uuid.UUID) (*entity.User, error)
	UpdateProfile(userID uuid.UUID, req *dto.UpdateProfileRequest) (*entity.User, error)
}

type authUsecase struct {
	userRepo    repository.UserRepository
	patientRepo repository.PatientRepository
}

func NewAuthUsecase(userRepo repository.UserRepository, patientRepo repository.PatientRepository) AuthUsecase {
	return &authUsecase{userRepo: userRepo, patientRepo: patientRepo}
}

func (u *authUsecase) Register(req *dto.RegisterRequest) (*entity.User, error) {
	// Check email unique
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
		Role:         entity.RolePatient,
		FullName:     req.FullName,
		Phone:        req.Phone,
		IsActive:     true,
	}

	if err := u.userRepo.Create(user); err != nil {
		return nil, errors.New("failed to create user")
	}

	// Create patient profile automatically
	patient := &entity.Patient{
		ID:     uuid.New(),
		UserID: userID,
	}
	_ = u.patientRepo.Create(patient)

	return user, nil
}

func (u *authUsecase) Login(req *dto.LoginRequest, jwtExpiryHours int) (string, *entity.User, error) {
	user, err := u.userRepo.FindByEmail(req.Email)
	if err != nil {
		return "", nil, errors.New("invalid email or password")
	}

	if !user.IsActive {
		return "", nil, errors.New("account is deactivated")
	}

	if !utils.CheckPassword(user.PasswordHash, req.Password) {
		return "", nil, errors.New("invalid email or password")
	}

	token, err := utils.GenerateToken(user.ID.String(), user.Email, string(user.Role), jwtExpiryHours)
	if err != nil {
		return "", nil, errors.New("failed to generate token")
	}

	return token, user, nil
}

func (u *authUsecase) GetProfile(userID uuid.UUID) (*entity.User, error) {
	return u.userRepo.FindByID(userID)
}

func (u *authUsecase) UpdateProfile(userID uuid.UUID, req *dto.UpdateProfileRequest) (*entity.User, error) {
	user, err := u.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if req.FullName != "" {
		user.FullName = req.FullName
	}
	if req.Phone != "" {
		user.Phone = req.Phone
	}

	if err := u.userRepo.Update(user); err != nil {
		return nil, errors.New("failed to update profile")
	}

	return user, nil
}
