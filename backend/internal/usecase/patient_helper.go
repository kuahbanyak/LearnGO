package usecase

import (
	"mediqueue/internal/entity"
	"mediqueue/internal/repository"
	apperrors "mediqueue/pkg/errors"
	"mediqueue/pkg/logger"

	"github.com/google/uuid"
	"go.uber.org/zap"
)

// GetOrCreatePatient retrieves patient by user ID or creates if missing
// This is a fallback for legacy data where patient profiles might be missing
func GetOrCreatePatient(
	patientRepo repository.PatientRepository,
	userID uuid.UUID,
) (*entity.Patient, error) {
	logger.Debug("Getting or creating patient", zap.String("user_id", userID.String()))

	patient, err := patientRepo.FindByUserID(userID)
	if err == nil {
		return patient, nil
	}

	// Patient not found - auto-create as fallback for legacy data
	logger.Warn("Patient profile not found, auto-creating", zap.String("user_id", userID.String()))

	patient = &entity.Patient{
		ID:     uuid.New(),
		UserID: userID,
	}

	if createErr := patientRepo.Create(patient); createErr != nil {
		logger.Error("Failed to auto-create patient profile", 
			zap.Error(createErr), 
			zap.String("user_id", userID.String()))
		return nil, apperrors.NewInternalError("patient profile not found and could not be created")
	}

	// Reload with User relation
	patient, err = patientRepo.FindByUserID(userID)
	if err != nil {
		logger.Error("Failed to reload patient after creation", 
			zap.Error(err), 
			zap.String("user_id", userID.String()))
		return nil, apperrors.NewInternalError("patient profile not found")
	}

	logger.Info("Patient profile auto-created", 
		zap.String("patient_id", patient.ID.String()),
		zap.String("user_id", userID.String()))

	return patient, nil
}
