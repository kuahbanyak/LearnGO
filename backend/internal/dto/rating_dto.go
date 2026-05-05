package dto

// ========================
// RATING DTOs
// ========================

type CreateRatingRequest struct {
	AppointmentID string `json:"appointment_id" binding:"required"`
	Score         int    `json:"score" binding:"required,min=1,max=5"`
	Comment       string `json:"comment"`
}

type RatingResponse struct {
	ID            string  `json:"id"`
	AppointmentID string  `json:"appointment_id"`
	Score         int     `json:"score"`
	Comment       string  `json:"comment,omitempty"`
	PatientName   string  `json:"patient_name,omitempty"`
	CreatedAt     string  `json:"created_at"`
}

type DoctorRatingSummary struct {
	DoctorID       string  `json:"doctor_id"`
	DoctorName     string  `json:"doctor_name"`
	AverageScore   float64 `json:"average_score"`
	TotalRatings   int64   `json:"total_ratings"`
}
