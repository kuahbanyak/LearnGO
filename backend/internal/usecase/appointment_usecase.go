package usecase

import (
	"errors"
	"time"

	"mediqueue/internal/dto"
	"mediqueue/internal/entity"
	"mediqueue/internal/repository"

	"github.com/google/uuid"
)

type AppointmentUsecase interface {
	Book(patientUserID uuid.UUID, req *dto.CreateAppointmentRequest) (*entity.Appointment, error)
	GetAll(limit, offset int, status, date string) ([]entity.Appointment, int64, error)
	GetByPatient(patientUserID uuid.UUID, limit, offset int) ([]entity.Appointment, int64, error)
	GetByDoctorDate(doctorUserID uuid.UUID, date time.Time) ([]entity.Appointment, error)
	GetByID(id uuid.UUID) (*entity.Appointment, error)
	UpdateStatus(id uuid.UUID, req *dto.UpdateAppointmentStatusRequest) (*entity.Appointment, error)
	Cancel(id uuid.UUID, actorRole string, actorUserID uuid.UUID, reason string) error
}

type appointmentUsecase struct {
	appointmentRepo repository.AppointmentRepository
	scheduleRepo    repository.ScheduleRepository
	patientRepo     repository.PatientRepository
	doctorRepo      repository.DoctorRepository
}

func NewAppointmentUsecase(
	appointmentRepo repository.AppointmentRepository,
	scheduleRepo repository.ScheduleRepository,
	patientRepo repository.PatientRepository,
	doctorRepo repository.DoctorRepository,
) AppointmentUsecase {
	return &appointmentUsecase{
		appointmentRepo: appointmentRepo,
		scheduleRepo:    scheduleRepo,
		patientRepo:     patientRepo,
		doctorRepo:      doctorRepo,
	}
}

func (u *appointmentUsecase) Book(patientUserID uuid.UUID, req *dto.CreateAppointmentRequest) (*entity.Appointment, error) {
	// Parse IDs
	doctorID, err := uuid.Parse(req.DoctorID)
	if err != nil {
		return nil, errors.New("invalid doctor ID")
	}
	scheduleID, err := uuid.Parse(req.ScheduleID)
	if err != nil {
		return nil, errors.New("invalid schedule ID")
	}
	appointmentDate, err := time.ParseInLocation("2006-01-02", req.AppointmentDate, time.Local)
	if err != nil {
		return nil, errors.New("invalid date format. Use YYYY-MM-DD")
	}

	// Validate date is not in the past
	if appointmentDate.Before(time.Now().Truncate(24 * time.Hour)) {
		return nil, errors.New("appointment date cannot be in the past")
	}

	// Get patient profile
	patient, err := u.patientRepo.FindByUserID(patientUserID)
	if err != nil {
		return nil, errors.New("patient profile not found")
	}

	// Validate schedule exists and matches doctor + day
	schedule, err := u.scheduleRepo.FindByID(scheduleID)
	if err != nil {
		return nil, errors.New("schedule not found")
	}
	if !schedule.IsActive {
		return nil, errors.New("schedule is not active")
	}
	if schedule.DoctorID != doctorID {
		return nil, errors.New("schedule does not belong to selected doctor")
	}

	// Validate appointment date matches schedule day
	if int(appointmentDate.Weekday()) != schedule.DayOfWeek {
		return nil, errors.New("appointment date does not match schedule day")
	}

	// Check quota
	count, _ := u.appointmentRepo.CountByScheduleAndDate(scheduleID, appointmentDate)
	if int(count) >= schedule.MaxPatient {
		return nil, errors.New("appointment quota for this schedule is full")
	}

	// Check if patient already has appointment on the same day with same doctor
	existing, _ := u.appointmentRepo.FindByDoctorIDAndDate(doctorID, appointmentDate)
	for _, a := range existing {
		if a.PatientID == patient.ID && a.Status != entity.StatusCancelled {
			return nil, errors.New("you already have an appointment with this doctor on this date")
		}
	}

	// Generate queue number
	queueNumber, _ := u.appointmentRepo.NextQueueNumber(scheduleID, appointmentDate)

	appointment := &entity.Appointment{
		ID:              uuid.New(),
		PatientID:       patient.ID,
		DoctorID:        doctorID,
		ScheduleID:      scheduleID,
		AppointmentDate: appointmentDate,
		QueueNumber:     queueNumber,
		Status:          entity.StatusWaiting,
	}

	if err := u.appointmentRepo.Create(appointment); err != nil {
		return nil, errors.New("failed to book appointment")
	}

	return u.appointmentRepo.FindByID(appointment.ID)
}

func (u *appointmentUsecase) GetAll(limit, offset int, status, date string) ([]entity.Appointment, int64, error) {
	return u.appointmentRepo.FindAll(limit, offset, status, date)
}

func (u *appointmentUsecase) GetByPatient(patientUserID uuid.UUID, limit, offset int) ([]entity.Appointment, int64, error) {
	patient, err := u.patientRepo.FindByUserID(patientUserID)
	if err != nil {
		return nil, 0, errors.New("patient not found")
	}
	return u.appointmentRepo.FindByPatientID(patient.ID, limit, offset)
}

func (u *appointmentUsecase) GetByDoctorDate(doctorUserID uuid.UUID, date time.Time) ([]entity.Appointment, error) {
	doctor, err := u.doctorRepo.FindByUserID(doctorUserID)
	if err != nil {
		return nil, errors.New("doctor not found")
	}
	return u.appointmentRepo.FindByDoctorIDAndDate(doctor.ID, date)
}

func (u *appointmentUsecase) GetByID(id uuid.UUID) (*entity.Appointment, error) {
	app, err := u.appointmentRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("appointment not found")
	}
	return app, nil
}

func (u *appointmentUsecase) UpdateStatus(id uuid.UUID, req *dto.UpdateAppointmentStatusRequest) (*entity.Appointment, error) {
	app, err := u.appointmentRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("appointment not found")
	}

	newStatus := entity.AppointmentStatus(req.Status)

	// Validate status transitions
	validTransitions := map[entity.AppointmentStatus][]entity.AppointmentStatus{
		entity.StatusWaiting:    {entity.StatusInProgress, entity.StatusCancelled},
		entity.StatusInProgress: {entity.StatusCompleted, entity.StatusCancelled},
	}

	allowed := validTransitions[app.Status]
	valid := false
	for _, s := range allowed {
		if s == newStatus {
			valid = true
			break
		}
	}
	if !valid {
		return nil, errors.New("invalid status transition")
	}

	app.Status = newStatus
	now := time.Now()
	if newStatus == entity.StatusInProgress {
		app.CheckedInAt = &now
	} else if newStatus == entity.StatusCompleted {
		app.CompletedAt = &now
	}

	if err := u.appointmentRepo.Update(app); err != nil {
		return nil, errors.New("failed to update status")
	}

	return app, nil
}

func (u *appointmentUsecase) Cancel(id uuid.UUID, actorRole string, actorUserID uuid.UUID, reason string) error {
	app, err := u.appointmentRepo.FindByID(id)
	if err != nil {
		return errors.New("appointment not found")
	}

	if app.Status == entity.StatusCompleted || app.Status == entity.StatusCancelled {
		return errors.New("this appointment cannot be cancelled")
	}

	// Patient can only cancel their own
	if actorRole == string(entity.RolePatient) {
		patient, _ := u.patientRepo.FindByUserID(actorUserID)
		if patient == nil || app.PatientID != patient.ID {
			return errors.New("you don't have permission to cancel this appointment")
		}
	}

	app.Status = entity.StatusCancelled
	app.CancelReason = reason
	return u.appointmentRepo.Update(app)
}
