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
	roleRepo    repository.RoleRepository
	db          *gorm.DB
}

func NewAuthUsecase(userRepo repository.UserRepository, patientRepo repository.PatientRepository, roleRepo repository.RoleRepository, db *gorm.DB) AuthUsecase {
	return &authUsecase{
		userRepo:    userRepo,
		patientRepo: patientRepo,
		roleRepo:    roleRepo,
		db:          db,
	}
}

func (u *authUsecase) Register(req *dto.RegisterRequest) (*entity.User, error) {
	logger.Info("Registration attempt", zap.String("email", req.Email), zap.String("username", req.Username))

	existing, _ := u.userRepo.FindByEmail(req.Email)
	if existing != nil {
		logger.Warn("Registration failed: duplicate email", zap.String("email", req.Email))
		return nil, apperrors.NewDuplicateError("email already registered")
	}

	existing, _ = u.userRepo.FindByUsername(req.Username)
	if existing != nil {
		logger.Warn("Registration failed: duplicate username", zap.String("username", req.Username))
		return nil, apperrors.NewDuplicateError("username already taken")
	}

	patientRole, err := u.roleRepo.FindByName("Patient")
	if err != nil {
		logger.Error("Failed to find patient role", zap.Error(err))
		return nil, apperrors.NewInternalError("failed to find patient role")
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

	tx := u.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			logger.Error("Panic during registration", zap.Any("panic", r))
		}
	}()

	user := &entity.User{
		ID:           userID,
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: hash,
		RoleID:       patientRole.ID,
		IsActive:     true,
	}

	if err := tx.Create(user).Error; err != nil {
		tx.Rollback()
		logger.Error("Failed to create user", zap.Error(err), zap.String("email", req.Email))
		return nil, apperrors.NewInternalError("failed to create user")
	}

	patient := &entity.Patient{
		ID:        uuid.New(),
		UserID:    userID,
		FullName:  req.FullName,
		Phone:     req.Phone,
		NIK:       nikPtr,
		Gender:    entity.Gender(req.Gender),
		Address:   req.Address,
		BloodType: entity.BloodType(req.BloodType),
	}

	if err := tx.Create(patient).Error; err != nil {
		tx.Rollback()
		logger.Error("Failed to create patient profile", zap.Error(err), zap.String("user_id", userID.String()))
		return nil, apperrors.NewInternalError("failed to create patient profile")
	}

	if err := tx.Commit().Error; err != nil {
		logger.Error("Failed to commit registration transaction", zap.Error(err))
		return nil, apperrors.NewInternalError("failed to complete registration")
	}

	user.Role = patientRole
	user.Patient = patient
	logger.Info("Registration successful", zap.String("user_id", userID.String()), zap.String("email", req.Email))
	return user, nil
}

func (u *authUsecase) Login(req *dto.LoginRequest, jwtExpiryHours int) (string, *entity.User, error) {
	logger.Info("Login attempt", zap.String("login", req.Login))

	user, err := u.userRepo.FindByLogin(req.Login)
	if err != nil {
		logger.Warn("Login failed: user not found", zap.String("login", req.Login))
		return "", nil, apperrors.NewUnauthorizedError("invalid username/email or password")
	}

	if !user.IsActive {
		logger.Warn("Login failed: account deactivated", zap.String("login", req.Login))
		return "", nil, apperrors.NewUnauthorizedError("account is deactivated")
	}

	if !utils.CheckPassword(user.PasswordHash, req.Password) {
		logger.Warn("Login failed: invalid password", zap.String("login", req.Login))
		return "", nil, apperrors.NewUnauthorizedError("invalid username/email or password")
	}

	token, err := utils.GenerateToken(user.ID.String(), user.Email, user.GetRoleName(), jwtExpiryHours)
	if err != nil {
		logger.Error("Failed to generate token", zap.Error(err), zap.String("user_id", user.ID.String()))
		return "", nil, apperrors.NewInternalError("failed to generate token")
	}

	logger.Info("Login successful", zap.String("user_id", user.ID.String()), zap.String("login", req.Login))
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

	if !entity.IsPatient(user) || user.Patient == nil {
		logger.Warn("Update profile failed: not a patient", zap.String("user_id", userID.String()))
		return nil, apperrors.NewInternalError("only patient profile can be updated")
	}

	patient := user.Patient
	if req.FullName != "" {
		patient.FullName = req.FullName
	}
	if req.Phone != "" {
		patient.Phone = req.Phone
	}
	if req.NIK != "" {
		patient.NIK = &req.NIK
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
		logger.Error("Failed to update patient profile", zap.Error(err), zap.String("user_id", userID.String()))
		return nil, apperrors.NewInternalError("failed to update profile")
	}

	user.Patient = patient
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
