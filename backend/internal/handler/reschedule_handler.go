package handler

import (
	"time"

	"mediqueue/internal/dto"
	"mediqueue/internal/middleware"
	"mediqueue/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// RescheduleAppointment handles appointment rescheduling
// PATCH /api/v1/appointments/:id/reschedule
func (h *AppointmentHandler) RescheduleAppointment(c *gin.Context) {
	claims := middleware.GetCurrentUser(c)
	userID, _ := uuid.Parse(claims.UserID)

	appointmentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid appointment ID")
		return
	}

	var req dto.RescheduleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	scheduleID, err := uuid.Parse(req.ScheduleID)
	if err != nil {
		response.BadRequest(c, "Invalid schedule ID")
		return
	}

	newDate, err := time.Parse("2006-01-02", req.AppointmentDate)
	if err != nil {
		response.BadRequest(c, "Invalid date format. Use YYYY-MM-DD")
		return
	}

	appointment, err := h.appointmentUsecase.Reschedule(userID, appointmentID, scheduleID, newDate)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, "Appointment rescheduled successfully", appointment)
}
