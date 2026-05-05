package usecase

import (
	"time"

	"mediqueue/internal/entity"

	"gorm.io/gorm"
)

// ── Analytics Response Types ──

type DailyAppointmentCount struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

type StatusDistribution struct {
	Waiting    int64 `json:"waiting"`
	InProgress int64 `json:"in_progress"`
	Completed  int64 `json:"completed"`
	Cancelled  int64 `json:"cancelled"`
}

type DoctorAppointmentCount struct {
	DoctorID       string `json:"doctor_id"`
	DoctorName     string `json:"doctor_name"`
	Specialization string `json:"specialization"`
	Count          int    `json:"count"`
}

type HourlyDistribution struct {
	Hour  int `json:"hour"`
	Count int `json:"count"`
}

type WeeklyTrend struct {
	Week  string `json:"week"`
	Count int    `json:"count"`
}

type AnalyticsData struct {
	AppointmentsByDay    []DailyAppointmentCount  `json:"appointments_by_day"`
	StatusDistribution   StatusDistribution        `json:"status_distribution"`
	AppointmentsByDoctor []DoctorAppointmentCount  `json:"appointments_by_doctor"`
	PeakHours            []HourlyDistribution      `json:"peak_hours"`
	CancellationRate     float64                   `json:"cancellation_rate"`
	WeeklyTrends         []WeeklyTrend             `json:"weekly_trends"`
	TotalThisMonth       int64                     `json:"total_this_month"`
	TotalLastMonth       int64                     `json:"total_last_month"`
	AvgPerDay            float64                   `json:"avg_per_day"`
}

type AnalyticsUsecase interface {
	GetAnalytics(days int) (*AnalyticsData, error)
}

type analyticsUsecase struct {
	db *gorm.DB
}

func NewAnalyticsUsecase(db *gorm.DB) AnalyticsUsecase {
	return &analyticsUsecase{db: db}
}

func (u *analyticsUsecase) GetAnalytics(days int) (*AnalyticsData, error) {
	if days <= 0 {
		days = 30
	}

	now := time.Now()
	startDate := now.AddDate(0, 0, -days)
	startOfDay := time.Date(startDate.Year(), startDate.Month(), startDate.Day(), 0, 0, 0, 0, startDate.Location())

	data := &AnalyticsData{}

	// 1. Appointments by day
	var dailyCounts []struct {
		Date  time.Time `gorm:"column:date"`
		Count int       `gorm:"column:count"`
	}
	u.db.Model(&entity.Appointment{}).
		Select("DATE(appointment_date) as date, COUNT(*) as count").
		Where("appointment_date >= ?", startOfDay).
		Group("DATE(appointment_date)").
		Order("date").
		Scan(&dailyCounts)

	for _, dc := range dailyCounts {
		data.AppointmentsByDay = append(data.AppointmentsByDay, DailyAppointmentCount{
			Date:  dc.Date.Format("2006-01-02"),
			Count: dc.Count,
		})
	}

	// 2. Status distribution (all time or within range)
	u.db.Model(&entity.Appointment{}).
		Where("appointment_date >= ? AND status = ?", startOfDay, entity.StatusWaiting).
		Count(&data.StatusDistribution.Waiting)
	u.db.Model(&entity.Appointment{}).
		Where("appointment_date >= ? AND status = ?", startOfDay, entity.StatusInProgress).
		Count(&data.StatusDistribution.InProgress)
	u.db.Model(&entity.Appointment{}).
		Where("appointment_date >= ? AND status = ?", startOfDay, entity.StatusCompleted).
		Count(&data.StatusDistribution.Completed)
	u.db.Model(&entity.Appointment{}).
		Where("appointment_date >= ? AND status = ?", startOfDay, entity.StatusCancelled).
		Count(&data.StatusDistribution.Cancelled)

	// 3. Appointments by doctor (top 10)
	var doctorCounts []struct {
		DoctorID       string `gorm:"column:doctor_id"`
		DoctorName     string `gorm:"column:doctor_name"`
		Specialization string `gorm:"column:specialization"`
		Count          int    `gorm:"column:count"`
	}
	u.db.Model(&entity.Appointment{}).
		Select("appointments.doctor_id, users.full_name as doctor_name, doctors.specialization, COUNT(*) as count").
		Joins("JOIN doctors ON doctors.id = appointments.doctor_id").
		Joins("JOIN users ON users.id = doctors.user_id").
		Where("appointment_date >= ?", startOfDay).
		Group("appointments.doctor_id, users.full_name, doctors.specialization").
		Order("count DESC").
		Limit(10).
		Scan(&doctorCounts)

	for _, dc := range doctorCounts {
		data.AppointmentsByDoctor = append(data.AppointmentsByDoctor, DoctorAppointmentCount{
			DoctorID:       dc.DoctorID,
			DoctorName:     dc.DoctorName,
			Specialization: dc.Specialization,
			Count:          dc.Count,
		})
	}

	// 4. Peak hours (based on schedule start times)
	var hourlyCounts []struct {
		Hour  int `gorm:"column:hour"`
		Count int `gorm:"column:count"`
	}
	u.db.Model(&entity.Appointment{}).
		Select("EXTRACT(HOUR FROM doctor_schedules.start_time::time) as hour, COUNT(*) as count").
		Joins("JOIN doctor_schedules ON doctor_schedules.id = appointments.schedule_id").
		Where("appointment_date >= ?", startOfDay).
		Group("hour").
		Order("hour").
		Scan(&hourlyCounts)

	for _, hc := range hourlyCounts {
		data.PeakHours = append(data.PeakHours, HourlyDistribution{
			Hour:  hc.Hour,
			Count: hc.Count,
		})
	}

	// 5. Cancellation rate
	var totalInRange int64
	u.db.Model(&entity.Appointment{}).Where("appointment_date >= ?", startOfDay).Count(&totalInRange)
	if totalInRange > 0 {
		data.CancellationRate = float64(data.StatusDistribution.Cancelled) / float64(totalInRange)
	}

	// 6. Weekly trends
	var weeklyData []struct {
		Week  string `gorm:"column:week"`
		Count int    `gorm:"column:count"`
	}
	u.db.Model(&entity.Appointment{}).
		Select("TO_CHAR(appointment_date, 'IYYY-IW') as week, COUNT(*) as count").
		Where("appointment_date >= ?", startOfDay).
		Group("week").
		Order("week").
		Scan(&weeklyData)

	for _, wd := range weeklyData {
		data.WeeklyTrends = append(data.WeeklyTrends, WeeklyTrend{
			Week:  wd.Week,
			Count: wd.Count,
		})
	}

	// 7. This month vs last month
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	startOfLastMonth := startOfMonth.AddDate(0, -1, 0)

	u.db.Model(&entity.Appointment{}).
		Where("appointment_date >= ?", startOfMonth).
		Count(&data.TotalThisMonth)
	u.db.Model(&entity.Appointment{}).
		Where("appointment_date >= ? AND appointment_date < ?", startOfLastMonth, startOfMonth).
		Count(&data.TotalLastMonth)

	// 8. Average per day
	if days > 0 {
		data.AvgPerDay = float64(totalInRange) / float64(days)
	}

	return data, nil
}
