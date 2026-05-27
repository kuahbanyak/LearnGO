package usecase

import (
	"errors"
	"time"

	"mediqueue/internal/dto"
	"mediqueue/internal/entity"
	"mediqueue/internal/repository"

	"github.com/google/uuid"
)

type ScheduleUsecase interface {
	Create(req *dto.CreateScheduleRequest) (*entity.DoctorSchedule, error)
	GetAll() ([]entity.DoctorSchedule, error)
	GetByDoctorID(doctorID uuid.UUID) ([]entity.DoctorSchedule, error)
	GetByID(id uuid.UUID) (*entity.DoctorSchedule, error)
	Update(id uuid.UUID, req *dto.UpdateScheduleRequest) (*entity.DoctorSchedule, error)
	Delete(id uuid.UUID) error
	Toggle(id uuid.UUID) (*entity.DoctorSchedule, error)
	GetAvailability(doctorID uuid.UUID, startDate, endDate time.Time) ([]dto.ScheduleAvailabilityResponse, error)
}

type scheduleUsecase struct {
	scheduleRepo    repository.ScheduleRepository
	doctorRepo      repository.DoctorRepository
	appointmentRepo repository.AppointmentRepository
}

func NewScheduleUsecase(scheduleRepo repository.ScheduleRepository, doctorRepo repository.DoctorRepository, appointmentRepo repository.AppointmentRepository) ScheduleUsecase {
	return &scheduleUsecase{
		scheduleRepo:    scheduleRepo,
		doctorRepo:      doctorRepo,
		appointmentRepo: appointmentRepo,
	}
}

func (u *scheduleUsecase) Create(req *dto.CreateScheduleRequest) (*entity.DoctorSchedule, error) {
	doctorID, err := uuid.Parse(req.DoctorID)
	if err != nil {
		return nil, errors.New("invalid doctor ID")
	}

	_, err = u.doctorRepo.FindByID(doctorID)
	if err != nil {
		return nil, errors.New("doctor not found")
	}

	schedule := &entity.DoctorSchedule{
		ID:         uuid.New(),
		DoctorID:   doctorID,
		DayOfWeek:  req.DayOfWeek,
		StartTime:  req.StartTime,
		EndTime:    req.EndTime,
		MaxPatient: req.MaxPatient,
		IsActive:   true,
	}

	if err := u.scheduleRepo.Create(schedule); err != nil {
		return nil, errors.New("failed to create schedule")
	}

	return u.scheduleRepo.FindByID(schedule.ID)
}

func (u *scheduleUsecase) GetAll() ([]entity.DoctorSchedule, error) {
	return u.scheduleRepo.FindAll()
}

func (u *scheduleUsecase) GetByDoctorID(doctorID uuid.UUID) ([]entity.DoctorSchedule, error) {
	return u.scheduleRepo.FindByDoctorID(doctorID)
}

func (u *scheduleUsecase) GetByID(id uuid.UUID) (*entity.DoctorSchedule, error) {
	s, err := u.scheduleRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("schedule not found")
	}
	return s, nil
}

func (u *scheduleUsecase) Update(id uuid.UUID, req *dto.UpdateScheduleRequest) (*entity.DoctorSchedule, error) {
	schedule, err := u.scheduleRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("schedule not found")
	}

	if req.DayOfWeek != nil {
		schedule.DayOfWeek = *req.DayOfWeek
	}
	if req.StartTime != "" {
		schedule.StartTime = req.StartTime
	}
	if req.EndTime != "" {
		schedule.EndTime = req.EndTime
	}
	if req.MaxPatient != nil {
		schedule.MaxPatient = *req.MaxPatient
	}
	if req.IsActive != nil {
		schedule.IsActive = *req.IsActive
	}

	if err := u.scheduleRepo.Update(schedule); err != nil {
		return nil, errors.New("failed to update schedule")
	}
	return schedule, nil
}

func (u *scheduleUsecase) Delete(id uuid.UUID) error {
	_, err := u.scheduleRepo.FindByID(id)
	if err != nil {
		return errors.New("schedule not found")
	}
	return u.scheduleRepo.Delete(id)
}

func (u *scheduleUsecase) Toggle(id uuid.UUID) (*entity.DoctorSchedule, error) {
	schedule, err := u.scheduleRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("schedule not found")
	}
	schedule.IsActive = !schedule.IsActive
	if err := u.scheduleRepo.Update(schedule); err != nil {
		return nil, errors.New("failed to toggle schedule")
	}
	return schedule, nil
}

func (u *scheduleUsecase) GetAvailability(doctorID uuid.UUID, startDate, endDate time.Time) ([]dto.ScheduleAvailabilityResponse, error) {
	// Get all schedules for the doctor
	schedules, err := u.scheduleRepo.FindByDoctorID(doctorID)
	if err != nil {
		return nil, errors.New("failed to retrieve schedules")
	}

	var availabilities []dto.ScheduleAvailabilityResponse

	// Iterate through each date in the range
	for date := startDate; !date.After(endDate); date = date.AddDate(0, 0, 1) {
		dayOfWeek := int(date.Weekday())

		// Find schedules that match this day of week
		for _, schedule := range schedules {
			if schedule.DayOfWeek == dayOfWeek {
				// Count bookings for this schedule on this date
				bookedCount, _ := u.appointmentRepo.CountByScheduleAndDate(schedule.ID, date)
				availableCount := schedule.MaxPatient - int(bookedCount)
				if availableCount < 0 {
					availableCount = 0
				}

				availabilities = append(availabilities, dto.ScheduleAvailabilityResponse{
					ScheduleID:     schedule.ID.String(),
					DoctorID:       schedule.DoctorID.String(),
					DayOfWeek:      schedule.DayOfWeek,
					StartTime:      schedule.StartTime,
					EndTime:        schedule.EndTime,
					MaxPatient:     schedule.MaxPatient,
					IsActive:       schedule.IsActive,
					Date:           date.Format("2006-01-02"),
					BookedCount:    int(bookedCount),
					AvailableCount: availableCount,
				})
			}
		}
	}

	return availabilities, nil
}
