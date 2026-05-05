package usecase

import (
	"encoding/json"
	"errors"

	"mediqueue/internal/dto"
	"mediqueue/internal/entity"
	"mediqueue/internal/repository"

	"github.com/google/uuid"
)

type SymptomScreeningUsecase interface {
	Create(patientUserID uuid.UUID, req *dto.SymptomScreeningRequest) (*entity.SymptomScreening, error)
	GetByAppointmentID(appointmentID uuid.UUID) (*entity.SymptomScreening, error)
	GetByPatientID(patientID uuid.UUID, limit, offset int) ([]entity.SymptomScreening, int64, error)
}

type symptomScreeningUsecase struct {
	screeningRepo  repository.SymptomScreeningRepository
	appointmentRepo repository.AppointmentRepository
	patientRepo    repository.PatientRepository
}

func NewSymptomScreeningUsecase(
	screeningRepo repository.SymptomScreeningRepository,
	appointmentRepo repository.AppointmentRepository,
	patientRepo repository.PatientRepository,
) SymptomScreeningUsecase {
	return &symptomScreeningUsecase{
		screeningRepo:   screeningRepo,
		appointmentRepo: appointmentRepo,
		patientRepo:     patientRepo,
	}
}

func (u *symptomScreeningUsecase) Create(patientUserID uuid.UUID, req *dto.SymptomScreeningRequest) (*entity.SymptomScreening, error) {
	// Get patient
	patient, err := u.patientRepo.FindByUserID(patientUserID)
	if err != nil {
		return nil, errors.New("patient not found")
	}

	// Parse appointment ID
	appointmentID, err := uuid.Parse(req.AppointmentID)
	if err != nil {
		return nil, errors.New("invalid appointment ID")
	}

	// Verify appointment belongs to patient
	appointment, err := u.appointmentRepo.FindByID(appointmentID)
	if err != nil {
		return nil, errors.New("appointment not found")
	}

	if appointment.PatientID != patient.ID {
		return nil, errors.New("you can only submit screening for your own appointments")
	}

	// Validate severity
	if req.Severity != "mild" && req.Severity != "moderate" && req.Severity != "severe" {
		return nil, errors.New("severity must be mild, moderate, or severe")
	}

	// Convert symptoms to JSON
	symptomsJSON, err := json.Marshal(req.Symptoms)
	if err != nil {
		return nil, errors.New("failed to process symptoms")
	}

	// Generate AI summary (placeholder - integrate OpenAI/Ollama here)
	aiSummary := u.generateAISummary(req.Symptoms, req.Severity, req.Duration)

	screening := &entity.SymptomScreening{
		ID:              uuid.New(),
		AppointmentID:   appointmentID,
		PatientID:       patient.ID,
		Symptoms:        string(symptomsJSON),
		Severity:        req.Severity,
		AdditionalNotes: req.AdditionalNotes,
		Duration:        req.Duration,
		Temperature:     req.Temperature,
		AISummary:       aiSummary,
	}

	if err := u.screeningRepo.Create(screening); err != nil {
		return nil, errors.New("failed to create symptom screening")
	}

	return screening, nil
}

func (u *symptomScreeningUsecase) GetByAppointmentID(appointmentID uuid.UUID) (*entity.SymptomScreening, error) {
	return u.screeningRepo.FindByAppointmentID(appointmentID)
}

func (u *symptomScreeningUsecase) GetByPatientID(patientID uuid.UUID, limit, offset int) ([]entity.SymptomScreening, int64, error) {
	return u.screeningRepo.FindByPatientID(patientID, limit, offset)
}

// generateAISummary creates a summary of symptoms (placeholder for AI integration)
func (u *symptomScreeningUsecase) generateAISummary(symptoms []string, severity, duration string) string {
	// TODO: Integrate with OpenAI API or local Ollama model
	// For now, return a simple summary
	
	if len(symptoms) == 0 {
		return "No symptoms reported"
	}

	summary := "Patient reports "
	for i, symptom := range symptoms {
		if i == 0 {
			summary += symptom
		} else if i == len(symptoms)-1 {
			summary += " and " + symptom
		} else {
			summary += ", " + symptom
		}
	}

	summary += " with " + severity + " severity"
	if duration != "" {
		summary += " lasting " + duration
	}

	return summary + "."
}
