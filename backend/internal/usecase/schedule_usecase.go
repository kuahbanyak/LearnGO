package usecase

import (
	"errors"

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
}

type scheduleUsecase struct {
	scheduleRepo repository.ScheduleRepository
	doctorRepo   repository.DoctorRepository
}

func NewScheduleUsecase(scheduleRepo repository.ScheduleRepository, doctorRepo repository.DoctorRepository) ScheduleUsecase {
	return &scheduleUsecase{scheduleRepo: scheduleRepo, doctorRepo: doctorRepo}
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
