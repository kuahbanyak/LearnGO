package dto

// ========================
// DOCTOR DTOs
// ========================

type CreateDoctorRequest struct {
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
