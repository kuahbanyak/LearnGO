package dto

// ========================
// APPOINTMENT DTOs
// ========================

type CreateAppointmentRequest struct {
	DoctorID        string `json:"doctor_id" binding:"required"`
	ScheduleID      string `json:"schedule_id" binding:"required"`
	AppointmentDate string `json:"appointment_date" binding:"required"` // "YYYY-MM-DD"
}

type UpdateAppointmentStatusRequest struct {
	Status       string `json:"status" binding:"required"`
	CancelReason string `json:"cancel_reason"`
}

// ========================
// MEDICAL RECORD DTOs
// ========================

type CreateMedicalRecordRequest struct {
	AppointmentID string                  `json:"appointment_id" binding:"required"`
	Complaint     string                  `json:"complaint" binding:"required"`
	Diagnosis     string                  `json:"diagnosis"`
	ICDCode       string                  `json:"icd_code"`
	ActionTaken   string                  `json:"action_taken"`
	DoctorNotes   string                  `json:"doctor_notes"`
	Prescriptions []CreatePrescriptionDTO `json:"prescriptions"`
}

type CreatePrescriptionDTO struct {
	MedicineName     string `json:"medicine_name" binding:"required"`
	Dosage           string `json:"dosage"`
	Quantity         int    `json:"quantity"`
	UsageInstruction string `json:"usage_instruction"`
	Notes            string `json:"notes"`
}
