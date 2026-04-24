package handler

import (
	"mediqueue/internal/dto"
	"mediqueue/internal/middleware"
	"mediqueue/internal/usecase"
	"mediqueue/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AuthHandler struct {
	authUsecase    usecase.AuthUsecase
	jwtExpiryHours int
}

func NewAuthHandler(authUsecase usecase.AuthUsecase, jwtExpiryHours int) *AuthHandler {
	return &AuthHandler{authUsecase: authUsecase, jwtExpiryHours: jwtExpiryHours}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	user, err := h.authUsecase.Register(&req)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Created(c, "Registration successful", user)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	token, user, err := h.authUsecase.Login(&req, h.jwtExpiryHours)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	response.Success(c, "Login successful", dto.LoginResponse{Token: token, User: user})
}

func (h *AuthHandler) GetProfile(c *gin.Context) {
	claims := middleware.GetCurrentUser(c)
	userID, _ := uuid.Parse(claims.UserID)

	user, err := h.authUsecase.GetProfile(userID)
	if err != nil {
		response.NotFound(c, "User not found")
		return
	}

	response.Success(c, "Profile retrieved", user)
}

func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	claims := middleware.GetCurrentUser(c)
	userID, _ := uuid.Parse(claims.UserID)

	var req dto.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	user, err := h.authUsecase.UpdateProfile(userID, &req)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, "Profile updated", user)
}

func (h *AuthHandler) DeleteProfile(c *gin.Context) {
	claims := middleware.GetCurrentUser(c)
	userID, _ := uuid.Parse(claims.UserID)

	err := h.authUsecase.DeleteProfile(userID)
	if err != nil {
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, "Profile deleted successfully", nil)
}
