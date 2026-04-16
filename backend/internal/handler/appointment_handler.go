package handler

import (
	"mediqueue/internal/dto"
	"mediqueue/internal/entity"
	"mediqueue/internal/middleware"
	"mediqueue/internal/usecase"
	"mediqueue/pkg/response"
	"mediqueue/pkg/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AppointmentHandler struct {
	appointmentUsecase usecase.AppointmentUsecase
}

func NewAppointmentHandler(uc usecase.AppointmentUsecase) *AppointmentHandler {
	return &AppointmentHandler{appointmentUsecase: uc}
}

func (h *AppointmentHandler) Book(c *gin.Context) {
	claims := middleware.GetCurrentUser(c)
	userID, _ := uuid.Parse(claims.UserID)

	var req dto.CreateAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	appointment, err := h.appointmentUsecase.Book(userID, &req)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Created(c, "Appointment booked successfully", appointment)
}

func (h *AppointmentHandler) GetAll(c *gin.Context) {
	pq := utils.GetPagination(c)
	status := c.Query("status")
	date := c.Query("date")

	appointments, total, err := h.appointmentUsecase.GetAll(pq.PerPage, pq.Offset, status, date)
	if err != nil {
		response.InternalServerError(c, "Failed to retrieve appointments")
		return
	}

	response.Paginated(c, "Appointments retrieved", appointments, response.NewMeta(pq.Page, pq.PerPage, total))
}

func (h *AppointmentHandler) GetMyAppointments(c *gin.Context) {
	claims := middleware.GetCurrentUser(c)
	userID, _ := uuid.Parse(claims.UserID)
	pq := utils.GetPagination(c)

	appointments, total, err := h.appointmentUsecase.GetByPatient(userID, pq.PerPage, pq.Offset)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Paginated(c, "My appointments retrieved", appointments, response.NewMeta(pq.Page, pq.PerPage, total))
}

func (h *AppointmentHandler) GetTodayQueue(c *gin.Context) {
	claims := middleware.GetCurrentUser(c)
	userID, _ := uuid.Parse(claims.UserID)

	appointments, err := h.appointmentUsecase.GetByDoctorToday(userID)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, "Today's queue retrieved", appointments)
}

func (h *AppointmentHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid appointment ID")
		return
	}

	appointment, err := h.appointmentUsecase.GetByID(id)
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}

	response.Success(c, "Appointment retrieved", appointment)
}

func (h *AppointmentHandler) UpdateStatus(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid appointment ID")
		return
	}

	var req dto.UpdateAppointmentStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	appointment, err := h.appointmentUsecase.UpdateStatus(id, &req)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, "Status updated", appointment)
}

func (h *AppointmentHandler) Cancel(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid appointment ID")
		return
	}

	claims := middleware.GetCurrentUser(c)
	userID, _ := uuid.Parse(claims.UserID)

	var body struct {
		Reason string `json:"reason"`
	}
	c.ShouldBindJSON(&body)

	if err := h.appointmentUsecase.Cancel(id, claims.Role, userID, body.Reason); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, "Appointment cancelled", nil)
}

func (h *AppointmentHandler) GetAllForAdmin(c *gin.Context) {
	_ = entity.RoleAdmin // ensure import used
	h.GetAll(c)
}
