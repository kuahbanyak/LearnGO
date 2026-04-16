package handler

import (
	"mediqueue/internal/dto"
	"mediqueue/internal/middleware"
	"mediqueue/internal/usecase"
	"mediqueue/pkg/response"
	"mediqueue/pkg/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PatientHandler struct {
	patientUsecase usecase.PatientUsecase
}

func NewPatientHandler(uc usecase.PatientUsecase) *PatientHandler {
	return &PatientHandler{patientUsecase: uc}
}

func (h *PatientHandler) GetAll(c *gin.Context) {
	pq := utils.GetPagination(c)
	search := c.Query("search")

	patients, total, err := h.patientUsecase.GetAll(pq.PerPage, pq.Offset, search)
	if err != nil {
		response.InternalServerError(c, "Failed to retrieve patients")
		return
	}

	response.Paginated(c, "Patients retrieved", patients, response.NewMeta(pq.Page, pq.PerPage, total))
}

func (h *PatientHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid patient ID")
		return
	}

	patient, err := h.patientUsecase.GetByID(id)
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}

	response.Success(c, "Patient retrieved", patient)
}

func (h *PatientHandler) UpdateMyProfile(c *gin.Context) {
	claims := middleware.GetCurrentUser(c)
	userID, _ := uuid.Parse(claims.UserID)

	var req dto.UpdatePatientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	patient, err := h.patientUsecase.Update(userID, &req)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, "Patient profile updated", patient)
}
