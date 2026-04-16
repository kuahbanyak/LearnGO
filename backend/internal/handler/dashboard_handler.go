package handler

import (
	"mediqueue/internal/middleware"
	"mediqueue/internal/usecase"
	"mediqueue/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type DashboardHandler struct {
	dashboardUsecase usecase.DashboardUsecase
}

func NewDashboardHandler(uc usecase.DashboardUsecase) *DashboardHandler {
	return &DashboardHandler{dashboardUsecase: uc}
}

func (h *DashboardHandler) GetAdminStats(c *gin.Context) {
	stats, err := h.dashboardUsecase.GetAdminStats()
	if err != nil {
		response.InternalServerError(c, "Failed to get stats")
		return
	}
	response.Success(c, "Admin dashboard stats", stats)
}

func (h *DashboardHandler) GetDoctorStats(c *gin.Context) {
	claims := middleware.GetCurrentUser(c)
	userID, _ := uuid.Parse(claims.UserID)

	stats, err := h.dashboardUsecase.GetDoctorStats(userID)
	if err != nil {
		response.InternalServerError(c, "Failed to get stats")
		return
	}
	response.Success(c, "Doctor dashboard stats", stats)
}

func (h *DashboardHandler) GetPatientStats(c *gin.Context) {
	claims := middleware.GetCurrentUser(c)
	userID, _ := uuid.Parse(claims.UserID)

	stats, err := h.dashboardUsecase.GetPatientStats(userID)
	if err != nil {
		response.InternalServerError(c, "Failed to get stats")
		return
	}
	response.Success(c, "Patient dashboard stats", stats)
}
