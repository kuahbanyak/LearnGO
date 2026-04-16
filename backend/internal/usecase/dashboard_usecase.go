package usecase

import (
	"time"

	"mediqueue/internal/entity"
	"mediqueue/internal/repository"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DashboardStats struct {
	TotalPatients    int64             `json:"total_patients"`
	TodayVisits      int64             `json:"today_visits"`
	ActiveDoctors    int64             `json:"active_doctors"`
	TodayQueue       int64             `json:"today_queue"`
	CompletedToday   int64             `json:"completed_today"`
	WaitingNow       int64             `json:"waiting_now"`
}

type DashboardUsecase interface {
	GetAdminStats() (*DashboardStats, error)
	GetDoctorStats(doctorUserID uuid.UUID) (*DashboardStats, error)
	GetPatientStats(patientUserID uuid.UUID) (*DashboardStats, error)
}

type dashboardUsecase struct {
	db          *gorm.DB
	doctorRepo  repository.DoctorRepository
	patientRepo repository.PatientRepository
}

func NewDashboardUsecase(db *gorm.DB, doctorRepo repository.DoctorRepository, patientRepo repository.PatientRepository) DashboardUsecase {
	return &dashboardUsecase{db: db, doctorRepo: doctorRepo, patientRepo: patientRepo}
}

func (u *dashboardUsecase) GetAdminStats() (*DashboardStats, error) {
	stats := &DashboardStats{}
	today := time.Now()
	startOfDay := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, today.Location())

	u.db.Model(&entity.Patient{}).Count(&stats.TotalPatients)
	u.db.Model(&entity.Doctor{}).Where("deleted_at IS NULL").Count(&stats.ActiveDoctors)
	u.db.Model(&entity.Appointment{}).
		Where("appointment_date >= ? AND appointment_date < ?", startOfDay, startOfDay.Add(24*time.Hour)).
		Count(&stats.TodayQueue)
	u.db.Model(&entity.Appointment{}).
		Where("appointment_date >= ? AND appointment_date < ? AND status = ?",
			startOfDay, startOfDay.Add(24*time.Hour), entity.StatusCompleted).
		Count(&stats.CompletedToday)
	u.db.Model(&entity.Appointment{}).
		Where("status = ?", entity.StatusWaiting).
		Count(&stats.WaitingNow)
	stats.TodayVisits = stats.CompletedToday

	return stats, nil
}

func (u *dashboardUsecase) GetDoctorStats(doctorUserID uuid.UUID) (*DashboardStats, error) {
	stats := &DashboardStats{}
	today := time.Now()
	startOfDay := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, today.Location())

	doctor, err := u.doctorRepo.FindByUserID(doctorUserID)
	if err != nil {
		return nil, err
	}

	u.db.Model(&entity.Appointment{}).
		Where("doctor_id = ? AND appointment_date >= ? AND appointment_date < ?",
			doctor.ID, startOfDay, startOfDay.Add(24*time.Hour)).
		Count(&stats.TodayQueue)
	u.db.Model(&entity.Appointment{}).
		Where("doctor_id = ? AND appointment_date >= ? AND appointment_date < ? AND status = ?",
			doctor.ID, startOfDay, startOfDay.Add(24*time.Hour), entity.StatusCompleted).
		Count(&stats.CompletedToday)
	u.db.Model(&entity.Appointment{}).
		Where("doctor_id = ? AND status = ?", doctor.ID, entity.StatusWaiting).
		Count(&stats.WaitingNow)
	u.db.Model(&entity.Appointment{}).
		Where("doctor_id = ? AND status = ?", doctor.ID, entity.StatusInProgress).
		Count(&stats.TodayVisits)

	return stats, nil
}

func (u *dashboardUsecase) GetPatientStats(patientUserID uuid.UUID) (*DashboardStats, error) {
	stats := &DashboardStats{}

	patient, err := u.patientRepo.FindByUserID(patientUserID)
	if err != nil {
		return nil, err
	}

	u.db.Model(&entity.Appointment{}).
		Where("patient_id = ? AND status = ?", patient.ID, entity.StatusWaiting).
		Count(&stats.WaitingNow)
	u.db.Model(&entity.Appointment{}).
		Where("patient_id = ? AND status = ?", patient.ID, entity.StatusCompleted).
		Count(&stats.CompletedToday)
	u.db.Model(&entity.Appointment{}).
		Where("patient_id = ?", patient.ID).
		Count(&stats.TodayQueue)

	return stats, nil
}
