package handler

import (
	"mediqueue/internal/dto"
	"mediqueue/internal/usecase"
	"mediqueue/pkg/response"
	"mediqueue/pkg/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type DoctorHandler struct {
	doctorUsecase usecase.DoctorUsecase
}

func NewDoctorHandler(uc usecase.DoctorUsecase) *DoctorHandler {
	return &DoctorHandler{doctorUsecase: uc}
}

func (h *DoctorHandler) Create(c *gin.Context) {
	var req dto.CreateDoctorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	doctor, err := h.doctorUsecase.Create(&req)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Created(c, "Doctor created", doctor)
}

func (h *DoctorHandler) GetAll(c *gin.Context) {
	pq := utils.GetPagination(c)

	doctors, total, err := h.doctorUsecase.GetAll(pq.PerPage, pq.Offset)
	if err != nil {
		response.InternalServerError(c, "Failed to retrieve doctors")
		return
	}

	response.Paginated(c, "Doctors retrieved", doctors, response.NewMeta(pq.Page, pq.PerPage, total))
}

func (h *DoctorHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid doctor ID")
		return
	}

	doctor, err := h.doctorUsecase.GetByID(id)
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}

	response.Success(c, "Doctor retrieved", doctor)
}

func (h *DoctorHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid doctor ID")
		return
	}

	var req dto.UpdateDoctorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	doctor, err := h.doctorUsecase.Update(id, &req)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, "Doctor updated", doctor)
}

func (h *DoctorHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid doctor ID")
		return
	}

	if err := h.doctorUsecase.Delete(id); err != nil {
		response.NotFound(c, err.Error())
		return
	}

	response.Success(c, "Doctor deleted", nil)
}
