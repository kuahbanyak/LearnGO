package handler

import (
	"mediqueue/internal/dto"
	"mediqueue/internal/middleware"
	"mediqueue/internal/repository"
	"mediqueue/internal/usecase"
	"mediqueue/pkg/response"
	"mediqueue/pkg/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type MedicalRecordHandler struct {
	medRecordUsecase usecase.MedicalRecordUsecase
	patientRepo      repository.PatientRepository
}

func NewMedicalRecordHandler(uc usecase.MedicalRecordUsecase, patientRepo repository.PatientRepository) *MedicalRecordHandler {
	return &MedicalRecordHandler{medRecordUsecase: uc, patientRepo: patientRepo}
}

func (h *MedicalRecordHandler) Create(c *gin.Context) {
	claims := middleware.GetCurrentUser(c)
	userID, _ := uuid.Parse(claims.UserID)

	var req dto.CreateMedicalRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	record, err := h.medRecordUsecase.Create(userID, &req)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Created(c, "Medical record created", record)
}

func (h *MedicalRecordHandler) GetByPatient(c *gin.Context) {
	patientID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid patient ID")
		return
	}
	pq := utils.GetPagination(c)

	records, total, err := h.medRecordUsecase.GetByPatientID(patientID, pq.PerPage, pq.Offset)
	if err != nil {
		response.InternalServerError(c, "Failed to retrieve records")
		return
	}

	response.Paginated(c, "Medical records retrieved", records, response.NewMeta(pq.Page, pq.PerPage, total))
}

// GetMyMedicalRecords — patient melihat rekam medisnya sendiri (via JWT)
func (h *MedicalRecordHandler) GetMyMedicalRecords(c *gin.Context) {
	claims := middleware.GetCurrentUser(c)
	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		response.BadRequest(c, "Invalid user ID")
		return
	}

	patient, err := h.patientRepo.FindByUserID(userID)
	if err != nil {
		response.NotFound(c, "Patient profile not found")
		return
	}

	pq := utils.GetPagination(c)
	records, total, err := h.medRecordUsecase.GetByPatientID(patient.ID, pq.PerPage, pq.Offset)
	if err != nil {
		response.InternalServerError(c, "Failed to retrieve records")
		return
	}

	response.Paginated(c, "My medical records retrieved", records, response.NewMeta(pq.Page, pq.PerPage, total))
}

func (h *MedicalRecordHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid record ID")
		return
	}

	record, err := h.medRecordUsecase.GetByID(id)
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}

	response.Success(c, "Medical record retrieved", record)
}
