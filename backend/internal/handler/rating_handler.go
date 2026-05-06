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

type RatingHandler struct {
	ratingUsecase usecase.RatingUsecase
}

func NewRatingHandler(uc usecase.RatingUsecase) *RatingHandler {
	return &RatingHandler{ratingUsecase: uc}
}

func (h *RatingHandler) Create(c *gin.Context) {
	claims := middleware.GetCurrentUser(c)
	userID, _ := uuid.Parse(claims.UserID)

	var req dto.CreateRatingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	rating, err := h.ratingUsecase.Create(userID, &req)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Created(c, "Rating submitted successfully", rating)
}

func (h *RatingHandler) GetByDoctor(c *gin.Context) {
	doctorID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid doctor ID")
		return
	}

	pq := utils.GetPagination(c)
	ratings, total, err := h.ratingUsecase.GetByDoctor(doctorID, pq.PerPage, pq.Offset)
	if err != nil {
		response.InternalServerError(c, "Failed to retrieve ratings")
		return
	}

	response.Paginated(c, "Doctor ratings retrieved", ratings, response.NewMeta(pq.Page, pq.PerPage, total))
}

func (h *RatingHandler) GetDoctorSummary(c *gin.Context) {
	doctorID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid doctor ID")
		return
	}

	summary, err := h.ratingUsecase.GetDoctorSummary(doctorID)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, "Doctor rating summary", summary)
}
