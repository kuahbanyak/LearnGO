package usecase

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"time"

	"mediqueue/internal/entity"
	"mediqueue/internal/repository"

	"github.com/google/uuid"
)

type CheckInUsecase interface {
	GenerateQRToken(appointmentID uuid.UUID) (*entity.CheckInToken, string, error)
	ValidateAndCheckIn(tokenString string) (*entity.Appointment, error)
	GetQRCode(appointmentID uuid.UUID) ([]byte, error)
}

type checkInUsecase struct {
	tokenRepo      repository.CheckInTokenRepository
	appointmentRepo repository.AppointmentRepository
}

func NewCheckInUsecase(
	tokenRepo repository.CheckInTokenRepository,
	appointmentRepo repository.AppointmentRepository,
) CheckInUsecase {
	return &checkInUsecase{
		tokenRepo:      tokenRepo,
		appointmentRepo: appointmentRepo,
	}
}

// GenerateQRToken creates a new check-in token for an appointment
func (u *checkInUsecase) GenerateQRToken(appointmentID uuid.UUID) (*entity.CheckInToken, string, error) {
	// Check if appointment exists and is in waiting status
	appointment, err := u.appointmentRepo.FindByID(appointmentID)
	if err != nil {
		return nil, "", errors.New("appointment not found")
	}

	if appointment.Status != entity.StatusWaiting {
		return nil, "", errors.New("can only check in for waiting appointments")
	}

	// Check if appointment has patient loaded
	if appointment.PatientID == uuid.Nil {
		return nil, "", errors.New("appointment has no patient assigned")
	}

	// Generate secure random token
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return nil, "", errors.New("failed to generate token")
	}
	tokenString := hex.EncodeToString(tokenBytes)

	// Set expiration to end of appointment day
	expiresAt := time.Date(
		appointment.AppointmentDate.Year(),
		appointment.AppointmentDate.Month(),
		appointment.AppointmentDate.Day(),
		23, 59, 59, 0,
		appointment.AppointmentDate.Location(),
	)

	checkInToken := &entity.CheckInToken{
		ID:            uuid.New(),
		AppointmentID: appointmentID,
		Token:         tokenString,
		ExpiresAt:     expiresAt,
	}

	if err := u.tokenRepo.Create(checkInToken); err != nil {
		return nil, "", errors.New("failed to create check-in token")
	}

	return checkInToken, tokenString, nil
}

// ValidateAndCheckIn validates the token and marks the patient as checked in
func (u *checkInUsecase) ValidateAndCheckIn(tokenString string) (*entity.Appointment, error) {
	token, err := u.tokenRepo.FindByToken(tokenString)
	if err != nil {
		return nil, errors.New("invalid check-in token")
	}

	// Check if token is expired
	if time.Now().After(token.ExpiresAt) {
		return nil, errors.New("check-in token has expired")
	}

	// Check if token already used
	if token.UsedAt != nil {
		return nil, errors.New("check-in token already used")
	}

	// Get appointment
	appointment, err := u.appointmentRepo.FindByID(token.AppointmentID)
	if err != nil {
		return nil, errors.New("appointment not found")
	}

	// Verify appointment is still in waiting status
	if appointment.Status != entity.StatusWaiting {
		return nil, errors.New("appointment is no longer in waiting status")
	}

	// Mark token as used
	now := time.Now()
	if err := u.tokenRepo.MarkUsed(tokenString, now); err != nil {
		return nil, errors.New("failed to mark token as used")
	}

	// Note: We don't change appointment status here, just mark as checked in
	// The doctor will still need to call the patient and change status to in_progress

	return appointment, nil
}

// GetQRCode generates a QR code image for the check-in URL
func (u *checkInUsecase) GetQRCode(appointmentID uuid.UUID) ([]byte, error) {
	token, _, err := u.GenerateQRToken(appointmentID)
	if err != nil {
		return nil, err
	}

	// Generate QR code using skip2/go-qrcode
	// This will be implemented in the handler to avoid import cycles
	return []byte(token.Token), nil
}
