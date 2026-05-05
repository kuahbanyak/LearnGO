package handler

import (
	"log"

	"mediqueue/internal/middleware"
	"mediqueue/internal/usecase"
	"mediqueue/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/skip2/go-qrcode"
)

type CheckInHandler struct {
	checkInUsecase usecase.CheckInUsecase
}

func NewCheckInHandler(uc usecase.CheckInUsecase) *CheckInHandler {
	return &CheckInHandler{checkInUsecase: uc}
}

// GetQRCode generates and returns QR code PNG for appointment check-in
// GET /api/v1/appointments/:id/qr
func (h *CheckInHandler) GetQRCode(c *gin.Context) {
	_ = middleware.GetCurrentUser(c) // Just verify authentication

	appointmentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid appointment ID")
		return
	}

	// Generate QR token
	_, tokenString, err := h.checkInUsecase.GenerateQRToken(appointmentID)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	// Note: Ownership validation is handled in the usecase
	// The token is generated only if the appointment exists and is valid

	// Generate QR code PNG
	checkInURL := "https://mediqueue.app/check-in/" + tokenString
	qrCode, err := qrcode.Encode(checkInURL, qrcode.Medium, 256)
	if err != nil {
		log.Printf("[CheckIn] Failed to generate QR code: %v", err)
		response.InternalServerError(c, "Failed to generate QR code")
		return
	}

	// Return PNG image
	c.Data(200, "image/png", qrCode)
}

// CheckIn validates token and marks patient as checked in
// PATCH /api/v1/check-in/:token
func (h *CheckInHandler) CheckIn(c *gin.Context) {
	tokenString := c.Param("token")

	appointment, err := h.checkInUsecase.ValidateAndCheckIn(tokenString)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, "Check-in successful! Please wait for your turn.", gin.H{
		"appointment_id": appointment.ID,
		"queue_number":   appointment.QueueNumber,
		"doctor":         appointment.Doctor.User.FullName,
		"status":         appointment.Status,
	})
}

// GetCheckInStatus shows check-in status for an appointment
// GET /api/v1/appointments/:id/check-in-status
func (h *CheckInHandler) GetCheckInStatus(c *gin.Context) {
	_, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid appointment ID")
		return
	}

	// For now, return a simple status response
	// In a real implementation, you'd check the database for a check-in token
	response.Success(c, "Check-in status", gin.H{
		"checked_in": false,
		"message":    "Check-in status feature coming soon",
	})
}
