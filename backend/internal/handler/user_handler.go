package handler

import (
	"strconv"

	"mediqueue/internal/dto"
	"mediqueue/internal/usecase"
	"mediqueue/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UserHandler struct {
	userUsecase usecase.UserUsecase
}

func NewUserHandler(userUsecase usecase.UserUsecase) *UserHandler {
	return &UserHandler{userUsecase: userUsecase}
}

func (h *UserHandler) GetAll(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	users, total, err := h.userUsecase.GetAll(limit, offset)
	if err != nil {
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, "Users retrieved successfully", gin.H{
		"users": users,
		"total": total,
	})
}

func (h *UserHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		response.BadRequest(c, "Invalid user ID")
		return
	}

	user, err := h.userUsecase.GetByID(id)
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}

	response.Success(c, "User retrieved successfully", user)
}

func (h *UserHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		response.BadRequest(c, "Invalid user ID")
		return
	}

	var req dto.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	updatedUser, err := h.userUsecase.Update(id, &req)
	if err != nil {
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, "User updated successfully", updatedUser)
}

func (h *UserHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		response.BadRequest(c, "Invalid user ID")
		return
	}

	if err := h.userUsecase.Delete(id); err != nil {
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, "User deleted successfully", nil)
}
