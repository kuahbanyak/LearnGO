package handler

import (
	"mediqueue/internal/dto"
	"mediqueue/internal/middleware"
	"mediqueue/internal/usecase"
	"mediqueue/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SymptomScreeningHandler struct {
	screeningUsecase usecase.SymptomScreeningUsecase
}

func NewSymptomScreeningHandler(uc usecase.SymptomScreeningUsecase) *SymptomScreeningHandler {
	return &SymptomScreeningHandler{screeningUsecase: uc}
}

// Create handles symptom screening submission
// POST /api/v1/symptom-screenings
func (h *SymptomScreeningHandler) Create(c *gin.Context) {
	claims := middleware.GetCurrentUser(c)
	userID, _ := uuid.Parse(claims.UserID)

	var req dto.SymptomScreeningRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	screening, err := h.screeningUsecase.Create(userID, &req)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Created(c, "Symptom screening submitted successfully", screening)
}

// GetByAppointment retrieves screening for an appointment
// GET /api/v1/appointments/:id/symptoms
func (h *SymptomScreeningHandler) GetByAppointment(c *gin.Context) {
	appointmentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid appointment ID")
		return
	}

	screening, err := h.screeningUsecase.GetByAppointmentID(appointmentID)
	if err != nil {
		response.Success(c, "No symptom screening found", nil)
		return
	}

	response.Success(c, "Symptom screening retrieved", screening)
}

// GetMyScreenings retrieves patient's own screenings
// GET /api/v1/symptom-screenings/my
func (h *SymptomScreeningHandler) GetMyScreenings(c *gin.Context) {
	claims := middleware.GetCurrentUser(c)
	userID, _ := uuid.Parse(claims.UserID)

	// Get patient ID from user ID (simplified - in real app you'd fetch patient first)
	screenings, total, err := h.screeningUsecase.GetByPatientID(userID, 10, 0)
	if err != nil {
		response.InternalServerError(c, "Failed to retrieve screenings")
		return
	}

	response.Success(c, "Your symptom screenings", gin.H{
		"total":  total,
		"items":  screenings,
	})
}
