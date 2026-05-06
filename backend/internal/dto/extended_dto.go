package dto

// ========================
// RESCHEDULE DTOs
// ========================

type RescheduleRequest struct {
	ScheduleID      string `json:"schedule_id" binding:"required"`
	AppointmentDate string `json:"appointment_date" binding:"required"`
}

// ========================
// SYMPTOM PRE-SCREENING DTOs
// ========================

type SymptomScreeningRequest struct {
	AppointmentID     string   `json:"appointment_id" binding:"required"`
	Symptoms          []string `json:"symptoms" binding:"required"`
	Severity          string   `json:"severity" binding:"required"` // mild, moderate, severe
	AdditionalNotes   string   `json:"additional_notes"`
	Duration          string   `json:"duration"` // e.g., "2 days", "1 week"
	Temperature       string   `json:"temperature"` // e.g., "38.5°C"
}

type SymptomScreeningResponse struct {
	ID                string   `json:"id"`
	AppointmentID     string   `json:"appointment_id"`
	Symptoms          []string `json:"symptoms"`
	Severity          string   `json:"severity"`
	AdditionalNotes   string   `json:"additional_notes"`
	Duration          string   `json:"duration"`
	Temperature       string   `json:"temperature"`
	AISummary         string   `json:"ai_summary,omitempty"`
	CreatedAt         string   `json:"created_at"`
}

// ========================
// EXPORT DTOs
// ========================

type ExportRequest struct {
	StartDate string `form:"start_date"`
	EndDate   string `form:"end_date"`
	Format    string `form:"format"` // xlsx, pdf
	DoctorID  string `form:"doctor_id"`
	Status    string `form:"status"`
}

// ========================
// SEARCH/FILTER DTOs
// ========================

type SearchParams struct {
	Search string `form:"search"`
	Status string `form:"status"`
	Date   string `form:"date"`
	Page   int    `form:"page"`
	Limit  int    `form:"limit"`
}
