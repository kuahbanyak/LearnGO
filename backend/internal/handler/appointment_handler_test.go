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
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockAppointmentUsecase struct {
	mock.Mock
}

func (m *MockAppointmentUsecase) Book(patientUserID uuid.UUID, req *dto.CreateAppointmentRequest) (*entity.Appointment, error) {
	args := m.Called(patientUserID, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Appointment), args.Error(1)
}

func (m *MockAppointmentUsecase) GetAll(limit, offset int, status, date string) ([]entity.Appointment, int64, error) {
	args := m.Called(limit, offset, status, date)
	return args.Get(0).([]entity.Appointment), args.Get(1).(int64), args.Error(2)
}

func (m *MockAppointmentUsecase) GetByPatient(patientUserID uuid.UUID, limit, offset int) ([]entity.Appointment, int64, error) {
	args := m.Called(patientUserID, limit, offset)
	return args.Get(0).([]entity.Appointment), args.Get(1).(int64), args.Error(2)
}

func (m *MockAppointmentUsecase) GetByDoctorDate(doctorUserID uuid.UUID, date time.Time) ([]entity.Appointment, error) {
	args := m.Called(doctorUserID, date)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]entity.Appointment), args.Error(1)
}

func (m *MockAppointmentUsecase) GetByID(id uuid.UUID) (*entity.Appointment, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Appointment), args.Error(1)
}

func (m *MockAppointmentUsecase) UpdateStatus(id uuid.UUID, req *dto.UpdateAppointmentStatusRequest) (*entity.Appointment, error) {
	args := m.Called(id, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Appointment), args.Error(1)
}

func (m *MockAppointmentUsecase) Cancel(id uuid.UUID, actorRole string, actorUserID uuid.UUID, reason string) error {
	args := m.Called(id, actorRole, actorUserID, reason)
	return args.Error(0)
}

func (m *MockAppointmentUsecase) Reschedule(patientUserID uuid.UUID, appointmentID uuid.UUID, scheduleID uuid.UUID, newDate time.Time) (*entity.Appointment, error) {
	args := m.Called(patientUserID, appointmentID, scheduleID, newDate)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Appointment), args.Error(1)
}

func setupAppointmentTest() (*gin.Engine, *MockAppointmentUsecase) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	mockUsecase := new(MockAppointmentUsecase)
	return router, mockUsecase
}

func TestAppointmentHandler_Book_Success(t *testing.T) {
	router, mockUsecase := setupAppointmentTest()
	handler := NewAppointmentHandler(mockUsecase)

	userID := uuid.New()
	appointmentID := uuid.New()
	expectedAppointment := &entity.Appointment{
		ID:              appointmentID,
		AppointmentDate: time.Now().AddDate(0, 0, 1),
		Status:          entity.StatusWaiting,
	}

	mockUsecase.On("Book", userID, mock.AnythingOfType("*dto.CreateAppointmentRequest")).Return(expectedAppointment, nil)

	router.POST("/appointments", func(c *gin.Context) {
		c.Set(middleware.UserContextKey, &utils.JWTClaims{UserID: userID.String()})
		handler.Book(c)
	})

	reqBody := dto.CreateAppointmentRequest{
		DoctorID:        uuid.New().String(),
		ScheduleID:      uuid.New().String(),
		AppointmentDate: time.Now().AddDate(0, 0, 1).Format("2006-01-02"),
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest(http.MethodPost, "/appointments", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	mockUsecase.AssertExpectations(t)
}

func TestAppointmentHandler_Book_UsecaseError(t *testing.T) {
	router, mockUsecase := setupAppointmentTest()
	handler := NewAppointmentHandler(mockUsecase)

	userID := uuid.New()
	mockUsecase.On("Book", userID, mock.AnythingOfType("*dto.CreateAppointmentRequest")).Return(nil, errors.New("appointment quota full"))

	router.POST("/appointments", func(c *gin.Context) {
		c.Set(middleware.UserContextKey, &utils.JWTClaims{UserID: userID.String()})
		handler.Book(c)
	})

	reqBody := dto.CreateAppointmentRequest{
		DoctorID:        uuid.New().String(),
		ScheduleID:      uuid.New().String(),
		AppointmentDate: time.Now().AddDate(0, 0, 1).Format("2006-01-02"),
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest(http.MethodPost, "/appointments", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	mockUsecase.AssertExpectations(t)
}

func TestAppointmentHandler_GetAll_Success(t *testing.T) {
	router, mockUsecase := setupAppointmentTest()
	handler := NewAppointmentHandler(mockUsecase)

	appointments := []entity.Appointment{{ID: uuid.New()}}
	mockUsecase.On("GetAll", 10, 0, "", "").Return(appointments, int64(1), nil)

	router.GET("/appointments", handler.GetAll)

	req, _ := http.NewRequest(http.MethodGet, "/appointments?page=1&per_page=10", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockUsecase.AssertExpectations(t)
}

func TestAppointmentHandler_GetMyAppointments_Success(t *testing.T) {
	router, mockUsecase := setupAppointmentTest()
	handler := NewAppointmentHandler(mockUsecase)

	userID := uuid.New()
	appointments := []entity.Appointment{{ID: uuid.New()}}
	mockUsecase.On("GetByPatient", userID, 10, 0).Return(appointments, int64(1), nil)

	router.GET("/my-appointments", func(c *gin.Context) {
		c.Set(middleware.UserContextKey, &utils.JWTClaims{UserID: userID.String()})
		handler.GetMyAppointments(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/my-appointments?page=1&per_page=10", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockUsecase.AssertExpectations(t)
}

func TestAppointmentHandler_GetTodayQueue_Success(t *testing.T) {
	router, mockUsecase := setupAppointmentTest()
	handler := NewAppointmentHandler(mockUsecase)

	userID := uuid.New()
	appointments := []entity.Appointment{{ID: uuid.New()}}
	mockUsecase.On("GetByDoctorDate", userID, mock.AnythingOfType("time.Time")).Return(appointments, nil)

	router.GET("/queue", func(c *gin.Context) {
		c.Set(middleware.UserContextKey, &utils.JWTClaims{UserID: userID.String()})
		handler.GetTodayQueue(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/queue", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockUsecase.AssertExpectations(t)
}

func TestAppointmentHandler_GetByID_Success(t *testing.T) {
	router, mockUsecase := setupAppointmentTest()
	handler := NewAppointmentHandler(mockUsecase)

	appointmentID := uuid.New()
	expectedAppointment := &entity.Appointment{ID: appointmentID}
	mockUsecase.On("GetByID", appointmentID).Return(expectedAppointment, nil)

	router.GET("/appointments/:id", handler.GetByID)

	req, _ := http.NewRequest(http.MethodGet, "/appointments/"+appointmentID.String(), nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockUsecase.AssertExpectations(t)
}

func TestAppointmentHandler_GetByID_NotFound(t *testing.T) {
	router, mockUsecase := setupAppointmentTest()
	handler := NewAppointmentHandler(mockUsecase)

	appointmentID := uuid.New()
	mockUsecase.On("GetByID", appointmentID).Return(nil, errors.New("not found"))

	router.GET("/appointments/:id", handler.GetByID)

	req, _ := http.NewRequest(http.MethodGet, "/appointments/"+appointmentID.String(), nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
	mockUsecase.AssertExpectations(t)
}

func TestAppointmentHandler_UpdateStatus_Success(t *testing.T) {
	router, mockUsecase := setupAppointmentTest()
	handler := NewAppointmentHandler(mockUsecase)

	appointmentID := uuid.New()
	expectedAppointment := &entity.Appointment{ID: appointmentID, Status: entity.StatusCompleted}
	mockUsecase.On("UpdateStatus", appointmentID, mock.AnythingOfType("*dto.UpdateAppointmentStatusRequest")).Return(expectedAppointment, nil)

	router.PATCH("/appointments/:id/status", handler.UpdateStatus)

	reqBody := dto.UpdateAppointmentStatusRequest{Status: "completed"}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest(http.MethodPatch, "/appointments/"+appointmentID.String()+"/status", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockUsecase.AssertExpectations(t)
}

func TestAppointmentHandler_Cancel_Success(t *testing.T) {
	router, mockUsecase := setupAppointmentTest()
	handler := NewAppointmentHandler(mockUsecase)

	appointmentID := uuid.New()
	userID := uuid.New()
	mockUsecase.On("Cancel", appointmentID, "Patient", userID, "Test reason").Return(nil)

	router.PATCH("/appointments/:id/cancel", func(c *gin.Context) {
		c.Set(middleware.UserContextKey, &utils.JWTClaims{UserID: userID.String(), Role: "Patient"})
		handler.Cancel(c)
	})

	reqBody := map[string]string{"reason": "Test reason"}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest(http.MethodPatch, "/appointments/"+appointmentID.String()+"/cancel", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockUsecase.AssertExpectations(t)
}
