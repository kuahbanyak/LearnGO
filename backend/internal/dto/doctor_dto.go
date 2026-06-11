package dto

// ========================
// DOCTOR DTOs
// ========================

type CreateDoctorRequest struct {
	Username       string `json:"username" binding:"required,min=3"`
	Email          string `json:"email" binding:"required,email"`
	Password       string `json:"password" binding:"required,min=8"`
	FullName       string `json:"full_name" binding:"required"`
	Phone          string `json:"phone"`
	Specialization string `json:"specialization" binding:"required"`
	SIPNumber      string `json:"sip_number" binding:"required"`
}

type UpdateDoctorRequest struct {
	FullName       string `json:"full_name"`
	Phone          string `json:"phone"`
	Specialization string `json:"specialization"`
	SIPNumber      string `json:"sip_number"`
}

// ========================
// SCHEDULE DTOs
// ========================

type CreateScheduleRequest struct {
	DoctorID   string `json:"doctor_id" binding:"required"`
	DayOfWeek  int    `json:"day_of_week" binding:"required,min=0,max=6"`
	StartTime  string `json:"start_time" binding:"required"`
	EndTime    string `json:"end_time" binding:"required"`
	MaxPatient int    `json:"max_patient" binding:"required,min=1"`
}

type UpdateScheduleRequest struct {
	DayOfWeek  *int   `json:"day_of_week"`
	StartTime  string `json:"start_time"`
	EndTime    string `json:"end_time"`
	MaxPatient *int   `json:"max_patient"`
	IsActive   *bool  `json:"is_active"`
}

// ScheduleAvailabilityResponse represents schedule with booking counts for a specific date
type ScheduleAvailabilityResponse struct {
	ScheduleID     string `json:"schedule_id"`
	DoctorID       string `json:"doctor_id"`
	DayOfWeek      int    `json:"day_of_week"`
	StartTime      string `json:"start_time"`
	EndTime        string `json:"end_time"`
	MaxPatient     int    `json:"max_patient"`
	IsActive       bool   `json:"is_active"`
	Date           string `json:"date"`            // YYYY-MM-DD format
	BookedCount    int    `json:"booked_count"`    // Number of appointments booked
	AvailableCount int    `json:"available_count"` // Remaining slots
}
