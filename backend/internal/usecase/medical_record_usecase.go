package usecase

import (
	"errors"

	"mediqueue/internal/dto"
	"mediqueue/internal/entity"
	"mediqueue/internal/repository"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MedicalRecordUsecase interface {
	Create(doctorUserID uuid.UUID, req *dto.CreateMedicalRecordRequest) (*entity.MedicalRecord, error)
	GetByID(id uuid.UUID) (*entity.MedicalRecord, error)
	GetByPatientID(patientID uuid.UUID, limit, offset int) ([]entity.MedicalRecord, int64, error)
}

type medicalRecordUsecase struct {
	medRecordRepo   repository.MedicalRecordRepository
	appointmentRepo repository.AppointmentRepository
	doctorRepo      repository.DoctorRepository
}

func NewMedicalRecordUsecase(
	medRecordRepo repository.MedicalRecordRepository,
	appointmentRepo repository.AppointmentRepository,
	doctorRepo repository.DoctorRepository,
) MedicalRecordUsecase {
	return &medicalRecordUsecase{
		medRecordRepo:   medRecordRepo,
		appointmentRepo: appointmentRepo,
		doctorRepo:      doctorRepo,
	}
}

func (u *medicalRecordUsecase) Create(doctorUserID uuid.UUID, req *dto.CreateMedicalRecordRequest) (*entity.MedicalRecord, error) {
	appointmentID, err := uuid.Parse(req.AppointmentID)
	if err != nil {
		return nil, errors.New("invalid appointment ID")
	}

	appointment, err := u.appointmentRepo.FindByID(appointmentID)
	if err != nil {
		return nil, errors.New("appointment not found")
	}

	if appointment.Status != entity.StatusInProgress {
		return nil, errors.New("appointment must be in_progress to create medical record")
	}

	// Verify this doctor owns the appointment
	doctor, err := u.doctorRepo.FindByUserID(doctorUserID)
	if err != nil {
		return nil, errors.New("doctor not found")
	}
	if appointment.DoctorID != doctor.ID {
		return nil, errors.New("you don't have permission for this appointment")
	}

	// Check if record already exists
	_, err = u.medRecordRepo.FindByAppointmentID(appointmentID)
	if err == nil {
		return nil, errors.New("medical record already exists for this appointment")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	record := &entity.MedicalRecord{
		ID:            uuid.New(),
		AppointmentID: appointmentID,
		PatientID:     appointment.PatientID,
		DoctorID:      doctor.ID,
		Complaint:     req.Complaint,
		Diagnosis:     req.Diagnosis,
		ICDCode:       req.ICDCode,
		ActionTaken:   req.ActionTaken,
		DoctorNotes:   req.DoctorNotes,
	}

	for _, p := range req.Prescriptions {
		record.Prescriptions = append(record.Prescriptions, entity.Prescription{
			ID:               uuid.New(),
			MedicineName:     p.MedicineName,
			Dosage:           p.Dosage,
			Quantity:         p.Quantity,
			UsageInstruction: p.UsageInstruction,
			Notes:            p.Notes,
		})
	}

	if err := u.medRecordRepo.Create(record); err != nil {
		return nil, errors.New("failed to create medical record")
	}

	return u.medRecordRepo.FindByID(record.ID)
}

func (u *medicalRecordUsecase) GetByID(id uuid.UUID) (*entity.MedicalRecord, error) {
	record, err := u.medRecordRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("medical record not found")
	}
	return record, nil
}

func (u *medicalRecordUsecase) GetByPatientID(patientID uuid.UUID, limit, offset int) ([]entity.MedicalRecord, int64, error) {
	return u.medRecordRepo.FindByPatientID(patientID, limit, offset)
}
