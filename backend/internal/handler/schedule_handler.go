package handler

import (
	"time"

	"mediqueue/internal/dto"
	"mediqueue/internal/usecase"
	"mediqueue/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ScheduleHandler struct {
	scheduleUsecase usecase.ScheduleUsecase
}

func NewScheduleHandler(uc usecase.ScheduleUsecase) *ScheduleHandler {
	return &ScheduleHandler{scheduleUsecase: uc}
}

func (h *ScheduleHandler) Create(c *gin.Context) {
	var req dto.CreateScheduleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	schedule, err := h.scheduleUsecase.Create(&req)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Created(c, "Schedule created", schedule)
}

func (h *ScheduleHandler) GetAll(c *gin.Context) {
	schedules, err := h.scheduleUsecase.GetAll()
	if err != nil {
		response.InternalServerError(c, "Failed to retrieve schedules")
		return
	}
	response.Success(c, "Schedules retrieved", schedules)
}

func (h *ScheduleHandler) GetByDoctor(c *gin.Context) {
	doctorID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid doctor ID")
		return
	}

	schedules, err := h.scheduleUsecase.GetByDoctorID(doctorID)
	if err != nil {
		response.InternalServerError(c, "Failed to retrieve schedules")
		return
	}
	response.Success(c, "Schedules retrieved", schedules)
}

func (h *ScheduleHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid schedule ID")
		return
	}

	var req dto.UpdateScheduleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	schedule, err := h.scheduleUsecase.Update(id, &req)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, "Schedule updated", schedule)
}

func (h *ScheduleHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid schedule ID")
		return
	}

	if err := h.scheduleUsecase.Delete(id); err != nil {
		response.NotFound(c, err.Error())
		return
	}

	response.Success(c, "Schedule deleted", nil)
}

func (h *ScheduleHandler) Toggle(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid schedule ID")
		return
	}

	schedule, err := h.scheduleUsecase.Toggle(id)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, "Schedule toggled", schedule)
}

func (h *ScheduleHandler) GetAvailability(c *gin.Context) {
	doctorID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid doctor ID")
		return
	}

	// Get query parameters for date range
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	// Default to next 7 days if not provided
	var startDate, endDate time.Time
	if startDateStr == "" {
		startDate = time.Now().Truncate(24 * time.Hour)
	} else {
		startDate, err = time.ParseInLocation("2006-01-02", startDateStr, time.Local)
		if err != nil {
			response.BadRequest(c, "Invalid start_date format. Use YYYY-MM-DD")
			return
		}
	}

	if endDateStr == "" {
		endDate = startDate.AddDate(0, 0, 6) // 7 days total
	} else {
		endDate, err = time.ParseInLocation("2006-01-02", endDateStr, time.Local)
		if err != nil {
			response.BadRequest(c, "Invalid end_date format. Use YYYY-MM-DD")
			return
		}
	}

	// Validate date range
	if endDate.Before(startDate) {
		response.BadRequest(c, "end_date must be after start_date")
		return
	}

	// Limit to 30 days max to prevent abuse
	if endDate.Sub(startDate) > 30*24*time.Hour {
		response.BadRequest(c, "Date range cannot exceed 30 days")
		return
	}

	availabilities, err := h.scheduleUsecase.GetAvailability(doctorID, startDate, endDate)
	if err != nil {
		response.InternalServerError(c, "Failed to retrieve schedule availability")
		return
	}

	response.Success(c, "Schedule availability retrieved", availabilities)
}
