package usecase

import (
	"errors"

	"mediqueue/internal/dto"
	"mediqueue/internal/entity"
	"mediqueue/internal/repository"

	"github.com/google/uuid"
)

type RatingUsecase interface {
	Create(patientUserID uuid.UUID, req *dto.CreateRatingRequest) (*entity.Rating, error)
	GetByDoctor(doctorID uuid.UUID, limit, offset int) ([]entity.Rating, int64, error)
	GetDoctorSummary(doctorID uuid.UUID) (*dto.DoctorRatingSummary, error)
}

type ratingUsecase struct {
	ratingRepo      repository.RatingRepository
	appointmentRepo repository.AppointmentRepository
	patientRepo     repository.PatientRepository
	doctorRepo      repository.DoctorRepository
}

func NewRatingUsecase(
	ratingRepo repository.RatingRepository,
	appointmentRepo repository.AppointmentRepository,
	patientRepo repository.PatientRepository,
	doctorRepo repository.DoctorRepository,
) RatingUsecase {
	return &ratingUsecase{
		ratingRepo:      ratingRepo,
		appointmentRepo: appointmentRepo,
		patientRepo:     patientRepo,
		doctorRepo:      doctorRepo,
	}
}

func (u *ratingUsecase) Create(patientUserID uuid.UUID, req *dto.CreateRatingRequest) (*entity.Rating, error) {
	appointmentID, err := uuid.Parse(req.AppointmentID)
	if err != nil {
		return nil, errors.New("invalid appointment ID")
	}

	// Get patient
	patient, err := u.patientRepo.FindByUserID(patientUserID)
	if err != nil {
		return nil, errors.New("patient not found")
	}

	// Get appointment
	appointment, err := u.appointmentRepo.FindByID(appointmentID)
	if err != nil {
		return nil, errors.New("appointment not found")
	}

	// Verify appointment belongs to patient
	if appointment.PatientID != patient.ID {
		return nil, errors.New("you can only rate your own appointments")
	}

	// Verify appointment is completed
	if appointment.Status != entity.StatusCompleted {
		return nil, errors.New("you can only rate completed appointments")
	}

	// Check if already rated
	existing, _ := u.ratingRepo.FindByAppointmentID(appointmentID)
	if existing != nil {
		return nil, errors.New("you have already rated this appointment")
	}

	// Validate score
	if req.Score < 1 || req.Score > 5 {
		return nil, errors.New("score must be between 1 and 5")
	}

	rating := &entity.Rating{
		ID:            uuid.New(),
		AppointmentID: appointmentID,
		PatientID:     patient.ID,
		DoctorID:      appointment.DoctorID,
		Score:         req.Score,
		Comment:       req.Comment,
	}

	if err := u.ratingRepo.Create(rating); err != nil {
		return nil, errors.New("failed to create rating")
	}

	return rating, nil
}

func (u *ratingUsecase) GetByDoctor(doctorID uuid.UUID, limit, offset int) ([]entity.Rating, int64, error) {
	return u.ratingRepo.FindByDoctorID(doctorID, limit, offset)
}

func (u *ratingUsecase) GetDoctorSummary(doctorID uuid.UUID) (*dto.DoctorRatingSummary, error) {
	doctor, err := u.doctorRepo.FindByID(doctorID)
	if err != nil {
		return nil, errors.New("doctor not found")
	}

	avg, count, err := u.ratingRepo.GetDoctorAverage(doctorID)
	if err != nil {
		return nil, errors.New("failed to get rating summary")
	}

	return &dto.DoctorRatingSummary{
		DoctorID:     doctorID.String(),
		DoctorName:   doctor.User.FullName,
		AverageScore: avg,
		TotalRatings: count,
	}, nil
}
