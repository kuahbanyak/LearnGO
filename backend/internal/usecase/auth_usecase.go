package usecase

import (
	"mediqueue/internal/dto"
	"mediqueue/internal/entity"
	"mediqueue/internal/repository"
	apperrors "mediqueue/pkg/errors"
	"mediqueue/pkg/logger"
	"mediqueue/pkg/utils"

	"github.com/google/uuid"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type AuthUsecase interface {
	Register(req *dto.RegisterRequest) (*entity.User, error)
	Login(req *dto.LoginRequest, jwtExpiryHours int) (string, *entity.User, error)
	GetProfile(userID uuid.UUID) (*entity.User, error)
	UpdateProfile(userID uuid.UUID, req *dto.UpdateProfileRequest) (*entity.User, error)
	DeleteProfile(userID uuid.UUID) error
}

type authUsecase struct {
	userRepo    repository.UserRepository
	patientRepo repository.PatientRepository
	db          *gorm.DB
}

func NewAuthUsecase(userRepo repository.UserRepository, patientRepo repository.PatientRepository, db *gorm.DB) AuthUsecase {
	return &authUsecase{
		userRepo:    userRepo,
		patientRepo: patientRepo,
		db:          db,
	}
}

func (u *authUsecase) Register(req *dto.RegisterRequest) (*entity.User, error) {
	logger.Info("Registration attempt", zap.String("email", req.Email))

	// Check email unique (before transaction)
	existing, _ := u.userRepo.FindByEmail(req.Email)
	if existing != nil {
		logger.Warn("Registration failed: duplicate email", zap.String("email", req.Email))
		return nil, apperrors.NewDuplicateError("email already registered")
	}

	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		logger.Error("Failed to hash password", zap.Error(err))
		return nil, apperrors.NewInternalError("failed to process password")
	}

	userID := uuid.New()
	var nikPtr *string
	if req.NIK != "" {
		nikPtr = &req.NIK
	}

	// Start database transaction for atomic user + patient creation
	tx := u.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			logger.Error("Panic during registration", zap.Any("panic", r))
		}
	}()

	// Create user within transaction
	user := &entity.User{
		ID:           userID,
		Email:        req.Email,
		PasswordHash: hash,
		Role:         entity.RolePatient,
		FullName:     req.FullName,
		Phone:        req.Phone,
		NIK:          nikPtr,
		Gender:       req.Gender,
		Address:      req.Address,
		BloodType:    req.BloodType,
		IsActive:     true,
	}

	if err := tx.Create(user).Error; err != nil {
		tx.Rollback()
		logger.Error("Failed to create user", zap.Error(err), zap.String("email", req.Email))
		return nil, apperrors.NewInternalError("failed to create user")
	}

	// Create patient profile within transaction
	patient := &entity.Patient{
		ID:     uuid.New(),
		UserID: userID,
	}

	if err := tx.Create(patient).Error; err != nil {
		tx.Rollback()
		logger.Error("Failed to create patient profile", zap.Error(err), zap.String("user_id", userID.String()))
		return nil, apperrors.NewInternalError("failed to create patient profile")
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		logger.Error("Failed to commit registration transaction", zap.Error(err))
		return nil, apperrors.NewInternalError("failed to complete registration")
	}

	logger.Info("Registration successful", zap.String("user_id", userID.String()), zap.String("email", req.Email))
	return user, nil
}

func (u *authUsecase) Login(req *dto.LoginRequest, jwtExpiryHours int) (string, *entity.User, error) {
	logger.Info("Login attempt", zap.String("email", req.Email))

	user, err := u.userRepo.FindByEmail(req.Email)
	if err != nil {
		logger.Warn("Login failed: user not found", zap.String("email", req.Email))
		return "", nil, apperrors.NewUnauthorizedError("invalid email or password")
	}

	if !user.IsActive {
		logger.Warn("Login failed: account deactivated", zap.String("email", req.Email))
		return "", nil, apperrors.NewUnauthorizedError("account is deactivated")
	}

	if !utils.CheckPassword(user.PasswordHash, req.Password) {
		logger.Warn("Login failed: invalid password", zap.String("email", req.Email))
		return "", nil, apperrors.NewUnauthorizedError("invalid email or password")
	}

	token, err := utils.GenerateToken(user.ID.String(), user.Email, string(user.Role), jwtExpiryHours)
	if err != nil {
		logger.Error("Failed to generate token", zap.Error(err), zap.String("user_id", user.ID.String()))
		return "", nil, apperrors.NewInternalError("failed to generate token")
	}

	logger.Info("Login successful", zap.String("user_id", user.ID.String()), zap.String("email", req.Email))
	return token, user, nil
}

func (u *authUsecase) GetProfile(userID uuid.UUID) (*entity.User, error) {
	user, err := u.userRepo.FindByID(userID)
	if err != nil {
		logger.Warn("Profile not found", zap.String("user_id", userID.String()))
		return nil, apperrors.NewNotFoundError("user not found")
	}
	return user, nil
}

func (u *authUsecase) UpdateProfile(userID uuid.UUID, req *dto.UpdateProfileRequest) (*entity.User, error) {
	user, err := u.userRepo.FindByID(userID)
	if err != nil {
		logger.Warn("Update profile failed: user not found", zap.String("user_id", userID.String()))
		return nil, apperrors.NewNotFoundError("user not found")
	}

	if req.FullName != "" {
		user.FullName = req.FullName
	}
	if req.Phone != "" {
		user.Phone = req.Phone
	}
	if req.NIK != "" {
		user.NIK = &req.NIK
	}
	if req.Gender != "" {
		user.Gender = req.Gender
	}
	if req.Address != "" {
		user.Address = req.Address
	}
	if req.BloodType != "" {
		user.BloodType = req.BloodType
	}

	if err := u.userRepo.Update(user); err != nil {
		logger.Error("Failed to update profile", zap.Error(err), zap.String("user_id", userID.String()))
		return nil, apperrors.NewInternalError("failed to update profile")
	}

	logger.Info("Profile updated", zap.String("user_id", userID.String()))
	return user, nil
}

func (u *authUsecase) DeleteProfile(userID uuid.UUID) error {
	_, err := u.userRepo.FindByID(userID)
	if err != nil {
		logger.Warn("Delete profile failed: user not found", zap.String("user_id", userID.String()))
		return apperrors.NewNotFoundError("user not found")
	}

	if err := u.userRepo.Delete(userID); err != nil {
		logger.Error("Failed to delete profile", zap.Error(err), zap.String("user_id", userID.String()))
		return apperrors.NewInternalError("failed to delete profile")
	}

	logger.Info("Profile deleted", zap.String("user_id", userID.String()))
	return nil
}
