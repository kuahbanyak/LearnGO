package handler

import (
	"bytes"
	"encoding/json"
	"errors"
	"mediqueue/internal/dto"
	"mediqueue/internal/entity"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockDoctorUsecase struct {
	mock.Mock
}

func (m *MockDoctorUsecase) Create(req *dto.CreateDoctorRequest) (*entity.Doctor, error) {
	args := m.Called(req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Doctor), args.Error(1)
}

func (m *MockDoctorUsecase) GetAll(limit, offset int) ([]entity.Doctor, int64, error) {
	args := m.Called(limit, offset)
	return args.Get(0).([]entity.Doctor), args.Get(1).(int64), args.Error(2)
}

func (m *MockDoctorUsecase) GetByID(id uuid.UUID) (*entity.Doctor, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Doctor), args.Error(1)
}

func (m *MockDoctorUsecase) Update(id uuid.UUID, req *dto.UpdateDoctorRequest) (*entity.Doctor, error) {
	args := m.Called(id, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Doctor), args.Error(1)
}

func (m *MockDoctorUsecase) Delete(id uuid.UUID) error {
	args := m.Called(id)
	return args.Error(0)
}

func setupDoctorTest() (*gin.Engine, *MockDoctorUsecase) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	mockUsecase := new(MockDoctorUsecase)
	return router, mockUsecase
}

func TestDoctorHandler_Create_Success(t *testing.T) {
	router, mockUsecase := setupDoctorTest()
	handler := NewDoctorHandler(mockUsecase)

	expectedDoctor := &entity.Doctor{
		ID:             uuid.New(),
		UserID:         uuid.New(),
		FullName:       "Dr. John Doe",
		Specialization: "Cardiology",
		SIPNumber:  "DOC12345",
	}

	mockUsecase.On("Create", mock.AnythingOfType("*dto.CreateDoctorRequest")).Return(expectedDoctor, nil)
	router.POST("/doctors", handler.Create)

	reqBody := dto.CreateDoctorRequest{
		Username:       "drjohn",
		Email:          "drjohn@example.com",
		Password:       "Password123!",
		FullName:       "Dr. John Doe",
		Specialization: "Cardiology",
		SIPNumber:  "DOC12345",
		Phone:          "081234567890",
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest(http.MethodPost, "/doctors", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	mockUsecase.AssertExpectations(t)
}

func TestDoctorHandler_Create_Error(t *testing.T) {
	router, mockUsecase := setupDoctorTest()
	handler := NewDoctorHandler(mockUsecase)

	mockUsecase.On("Create", mock.AnythingOfType("*dto.CreateDoctorRequest")).Return(nil, errors.New("email already registered"))
	router.POST("/doctors", handler.Create)

	reqBody := dto.CreateDoctorRequest{
		Username:       "drjohn",
		Email:          "drjohn@example.com",
		Password:       "Password123!",
		FullName:       "Dr. John Doe",
		Specialization: "Cardiology",
		SIPNumber:  "DOC12345",
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest(http.MethodPost, "/doctors", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	mockUsecase.AssertExpectations(t)
}

func TestDoctorHandler_GetAll_Success(t *testing.T) {
	router, mockUsecase := setupDoctorTest()
	handler := NewDoctorHandler(mockUsecase)

	doctors := []entity.Doctor{
		{ID: uuid.New(), FullName: "Dr. John Doe"},
		{ID: uuid.New(), FullName: "Dr. Jane Smith"},
	}
	mockUsecase.On("GetAll", 10, 0).Return(doctors, int64(2), nil)
	router.GET("/doctors", handler.GetAll)

	req, _ := http.NewRequest(http.MethodGet, "/doctors?page=1&per_page=10", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockUsecase.AssertExpectations(t)
}

func TestDoctorHandler_GetAll_Error(t *testing.T) {
	router, mockUsecase := setupDoctorTest()
	handler := NewDoctorHandler(mockUsecase)

	mockUsecase.On("GetAll", 10, 0).Return([]entity.Doctor{}, int64(0), errors.New("database error"))
	router.GET("/doctors", handler.GetAll)

	req, _ := http.NewRequest(http.MethodGet, "/doctors?page=1&per_page=10", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	mockUsecase.AssertExpectations(t)
}

func TestDoctorHandler_GetByID_Success(t *testing.T) {
	router, mockUsecase := setupDoctorTest()
	handler := NewDoctorHandler(mockUsecase)

	doctorID := uuid.New()
	expectedDoctor := &entity.Doctor{ID: doctorID, FullName: "Dr. John Doe", Specialization: "Cardiology"}
	mockUsecase.On("GetByID", doctorID).Return(expectedDoctor, nil)
	router.GET("/doctors/:id", handler.GetByID)

	req, _ := http.NewRequest(http.MethodGet, "/doctors/"+doctorID.String(), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockUsecase.AssertExpectations(t)
}

func TestDoctorHandler_GetByID_NotFound(t *testing.T) {
	router, mockUsecase := setupDoctorTest()
	handler := NewDoctorHandler(mockUsecase)

	doctorID := uuid.New()
	mockUsecase.On("GetByID", doctorID).Return(nil, errors.New("doctor not found"))
	router.GET("/doctors/:id", handler.GetByID)

	req, _ := http.NewRequest(http.MethodGet, "/doctors/"+doctorID.String(), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
	mockUsecase.AssertExpectations(t)
}

func TestDoctorHandler_GetByID_InvalidID(t *testing.T) {
	router, mockUsecase := setupDoctorTest()
	handler := NewDoctorHandler(mockUsecase)
	router.GET("/doctors/:id", handler.GetByID)

	req, _ := http.NewRequest(http.MethodGet, "/doctors/invalid-uuid", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	mockUsecase.AssertNotCalled(t, "GetByID")
}

func TestDoctorHandler_Update_Success(t *testing.T) {
	router, mockUsecase := setupDoctorTest()
	handler := NewDoctorHandler(mockUsecase)

	doctorID := uuid.New()
	expectedDoctor := &entity.Doctor{ID: doctorID, FullName: "Dr. John Doe Updated", Specialization: "Neurology"}
	mockUsecase.On("Update", doctorID, mock.AnythingOfType("*dto.UpdateDoctorRequest")).Return(expectedDoctor, nil)
	router.PUT("/doctors/:id", handler.Update)

	reqBody := dto.UpdateDoctorRequest{FullName: "Dr. John Doe Updated", Specialization: "Neurology"}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest(http.MethodPut, "/doctors/"+doctorID.String(), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockUsecase.AssertExpectations(t)
}

func TestDoctorHandler_Update_Error(t *testing.T) {
	router, mockUsecase := setupDoctorTest()
	handler := NewDoctorHandler(mockUsecase)

	doctorID := uuid.New()
	mockUsecase.On("Update", doctorID, mock.AnythingOfType("*dto.UpdateDoctorRequest")).Return(nil, errors.New("doctor not found"))
	router.PUT("/doctors/:id", handler.Update)

	reqBody := dto.UpdateDoctorRequest{FullName: "Dr. John Doe Updated"}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest(http.MethodPut, "/doctors/"+doctorID.String(), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	mockUsecase.AssertExpectations(t)
}

func TestDoctorHandler_Delete_Success(t *testing.T) {
	router, mockUsecase := setupDoctorTest()
	handler := NewDoctorHandler(mockUsecase)

	doctorID := uuid.New()
	mockUsecase.On("Delete", doctorID).Return(nil)
	router.DELETE("/doctors/:id", handler.Delete)

	req, _ := http.NewRequest(http.MethodDelete, "/doctors/"+doctorID.String(), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockUsecase.AssertExpectations(t)
}

func TestDoctorHandler_Delete_NotFound(t *testing.T) {
	router, mockUsecase := setupDoctorTest()
	handler := NewDoctorHandler(mockUsecase)

	doctorID := uuid.New()
	mockUsecase.On("Delete", doctorID).Return(errors.New("doctor not found"))
	router.DELETE("/doctors/:id", handler.Delete)

	req, _ := http.NewRequest(http.MethodDelete, "/doctors/"+doctorID.String(), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
	mockUsecase.AssertExpectations(t)
}
