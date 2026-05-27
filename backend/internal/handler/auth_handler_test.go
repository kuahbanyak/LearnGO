package handler

import (
	"bytes"
	"encoding/json"
	"errors"
	"mediqueue/internal/dto"
	"mediqueue/internal/entity"
	"mediqueue/internal/middleware"
	"mediqueue/pkg/utils"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockAuthUsecase is a mock implementation of AuthUsecase
type MockAuthUsecase struct {
	mock.Mock
}

func (m *MockAuthUsecase) Register(req *dto.RegisterRequest) (*entity.User, error) {
	args := m.Called(req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.User), args.Error(1)
}

func (m *MockAuthUsecase) Login(req *dto.LoginRequest, jwtExpiryHours int) (string, *entity.User, error) {
	args := m.Called(req, jwtExpiryHours)
	return args.String(0), args.Get(1).(*entity.User), args.Error(2)
}

func (m *MockAuthUsecase) GetProfile(userID uuid.UUID) (*entity.User, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.User), args.Error(1)
}

func (m *MockAuthUsecase) UpdateProfile(userID uuid.UUID, req *dto.UpdateProfileRequest) (*entity.User, error) {
	args := m.Called(userID, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.User), args.Error(1)
}

func (m *MockAuthUsecase) DeleteProfile(userID uuid.UUID) error {
	args := m.Called(userID)
	return args.Error(0)
}

func setupAuthTest() (*gin.Engine, *MockAuthUsecase) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	mockUsecase := new(MockAuthUsecase)
	return router, mockUsecase
}

func TestAuthHandler_Register_Success(t *testing.T) {
	router, mockUsecase := setupAuthTest()
	handler := NewAuthHandler(mockUsecase, 24)

	userID := uuid.New()
	expectedUser := &entity.User{
		ID:       userID,
		Username: "testuser",
		Email:    "test@example.com",
	}

	mockUsecase.On("Register", mock.AnythingOfType("*dto.RegisterRequest")).Return(expectedUser, nil)

	router.POST("/register", handler.Register)

	reqBody := dto.RegisterRequest{
		Username:    "testuser",
		Email:       "test@example.com",
		Password:    "Password123!",
		FullName:    "Test User",
		Phone:       "081234567890",
		Gender:      "male",
		Address:     "Test Address",
		BloodType:   "A",
		DateOfBirth: "1990-01-01",
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest(http.MethodPost, "/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	mockUsecase.AssertExpectations(t)
}

func TestAuthHandler_Register_ValidationError(t *testing.T) {
	router, mockUsecase := setupAuthTest()
	handler := NewAuthHandler(mockUsecase, 24)

	router.POST("/register", handler.Register)

	reqBody := map[string]string{
		"username": "testuser",
		"email":    "invalid-email",
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest(http.MethodPost, "/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	mockUsecase.AssertNotCalled(t, "Register")
}

func TestAuthHandler_Register_UsecaseError(t *testing.T) {
	router, mockUsecase := setupAuthTest()
	handler := NewAuthHandler(mockUsecase, 24)

	mockUsecase.On("Register", mock.AnythingOfType("*dto.RegisterRequest")).Return(nil, errors.New("email already registered"))

	router.POST("/register", handler.Register)

	reqBody := dto.RegisterRequest{
		Username:    "testuser",
		Email:       "test@example.com",
		Password:    "Password123!",
		FullName:    "Test User",
		Phone:       "081234567890",
		Gender:      "male",
		Address:     "Test Address",
		BloodType:   "A",
		DateOfBirth: "1990-01-01",
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest(http.MethodPost, "/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	mockUsecase.AssertExpectations(t)
}

func TestAuthHandler_Login_Success(t *testing.T) {
	router, mockUsecase := setupAuthTest()
	handler := NewAuthHandler(mockUsecase, 24)

	userID := uuid.New()
	expectedUser := &entity.User{
		ID:       userID,
		Username: "testuser",
		Email:    "test@example.com",
	}
	expectedToken := "jwt.token.here"

	mockUsecase.On("Login", mock.AnythingOfType("*dto.LoginRequest"), 24).Return(expectedToken, expectedUser, nil)

	router.POST("/login", handler.Login)

	reqBody := dto.LoginRequest{
		Login:    "testuser",
		Password: "Password123!",
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest(http.MethodPost, "/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockUsecase.AssertExpectations(t)
}

func TestAuthHandler_Login_InvalidCredentials(t *testing.T) {
	router, mockUsecase := setupAuthTest()
	handler := NewAuthHandler(mockUsecase, 24)

	mockUsecase.On("Login", mock.AnythingOfType("*dto.LoginRequest"), 24).Return("", (*entity.User)(nil), errors.New("invalid credentials"))

	router.POST("/login", handler.Login)

	reqBody := dto.LoginRequest{
		Login:    "testuser",
		Password: "wrongpassword",
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest(http.MethodPost, "/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	mockUsecase.AssertExpectations(t)
}

func TestAuthHandler_GetProfile_Success(t *testing.T) {
	router, mockUsecase := setupAuthTest()
	handler := NewAuthHandler(mockUsecase, 24)

	userID := uuid.New()
	expectedUser := &entity.User{
		ID:       userID,
		Username: "testuser",
		Email:    "test@example.com",
	}

	mockUsecase.On("GetProfile", userID).Return(expectedUser, nil)

	router.GET("/profile", func(c *gin.Context) {
		c.Set(middleware.UserContextKey, &utils.JWTClaims{UserID: userID.String()})
		handler.GetProfile(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/profile", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockUsecase.AssertExpectations(t)
}

func TestAuthHandler_GetProfile_NotFound(t *testing.T) {
	router, mockUsecase := setupAuthTest()
	handler := NewAuthHandler(mockUsecase, 24)

	userID := uuid.New()

	mockUsecase.On("GetProfile", userID).Return(nil, errors.New("user not found"))

	router.GET("/profile", func(c *gin.Context) {
		c.Set(middleware.UserContextKey, &utils.JWTClaims{UserID: userID.String()})
		handler.GetProfile(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/profile", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
	mockUsecase.AssertExpectations(t)
}

func TestAuthHandler_UpdateProfile_Success(t *testing.T) {
	router, mockUsecase := setupAuthTest()
	handler := NewAuthHandler(mockUsecase, 24)

	userID := uuid.New()
	expectedUser := &entity.User{
		ID:       userID,
		Username: "testuser",
		Email:    "test@example.com",
	}

	mockUsecase.On("UpdateProfile", userID, mock.AnythingOfType("*dto.UpdateProfileRequest")).Return(expectedUser, nil)

	router.PUT("/profile", func(c *gin.Context) {
		c.Set(middleware.UserContextKey, &utils.JWTClaims{UserID: userID.String()})
		handler.UpdateProfile(c)
	})

	reqBody := dto.UpdateProfileRequest{
		FullName: "Updated Name",
		Phone:    "081234567890",
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest(http.MethodPut, "/profile", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockUsecase.AssertExpectations(t)
}

func TestAuthHandler_DeleteProfile_Success(t *testing.T) {
	router, mockUsecase := setupAuthTest()
	handler := NewAuthHandler(mockUsecase, 24)

	userID := uuid.New()

	mockUsecase.On("DeleteProfile", userID).Return(nil)

	router.DELETE("/profile", func(c *gin.Context) {
		c.Set(middleware.UserContextKey, &utils.JWTClaims{UserID: userID.String()})
		handler.DeleteProfile(c)
	})

	req, _ := http.NewRequest(http.MethodDelete, "/profile", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockUsecase.AssertExpectations(t)
}
