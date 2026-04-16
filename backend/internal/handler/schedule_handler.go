package handler

import (
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
