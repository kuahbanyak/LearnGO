package handler

import (
	"mediqueue/internal/usecase"
	"mediqueue/pkg/response"
	"strconv"

	"github.com/gin-gonic/gin"
)

type AnalyticsHandler struct {
	analyticsUsecase usecase.AnalyticsUsecase
}

func NewAnalyticsHandler(uc usecase.AnalyticsUsecase) *AnalyticsHandler {
	return &AnalyticsHandler{analyticsUsecase: uc}
}

func (h *AnalyticsHandler) GetAnalytics(c *gin.Context) {
	days := 30
	if d := c.Query("days"); d != "" {
		if parsed, err := strconv.Atoi(d); err == nil && parsed > 0 {
			days = parsed
		}
	}

	data, err := h.analyticsUsecase.GetAnalytics(days)
	if err != nil {
		response.InternalServerError(c, "Failed to retrieve analytics")
		return
	}

	response.Success(c, "Analytics data retrieved", data)
}
