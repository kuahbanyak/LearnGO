package usecase

import (
	"sync"
	"testing"
	"time"

	"mediqueue/internal/dto"
	"mediqueue/internal/entity"
	"mediqueue/internal/repository"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// TestConcurrentBooking verifies that race conditions are properly handled
// when multiple users try to book the same doctor at the same time
func TestConcurrentBooking(t *testing.T) {
	// Skip if not running integration tests
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	// Setup test database
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	// Create test data
	doctor := createTestDoctor(t, db)
	schedule := createTestSchedule(t, db, doctor.ID, 10) // Max 10 patients
	appointmentDate := time.Now().AddDate(0, 0, 7).Format("2006-01-02")

	// Create usecase
	appointmentRepo := repository.NewAppointmentRepository(db)
	scheduleRepo := repository.NewScheduleRepository(db)
	patientRepo := repository.NewPatientRepository(db)
	doctorRepo := repository.NewDoctorRepository(db)
	
	uc := NewAppointmentUsecase(appointmentRepo, scheduleRepo, patientRepo, doctorRepo, db)

	// Simulate 20 concurrent users trying to book 10 available slots
	numConcurrentUsers := 20
	var wg sync.WaitGroup
	results := make(chan error, numConcurrentUsers)

	// Launch concurrent booking requests
	for i := 0; i < numConcurrentUsers; i++ {
		wg.Add(1)
		go func(userIndex int) {
			defer wg.Done()

			// Create a patient for this user
			patient := createTestPatient(t, db, userIndex)

			// Try to book
			req := &dto.CreateAppointmentRequest{
				DoctorID:        doctor.ID.String(),
				ScheduleID:      schedule.ID.String(),
				AppointmentDate: appointmentDate,
			}

			_, err := uc.Book(patient.UserID, req)
			results <- err
		}(i)
	}

	// Wait for all goroutines to complete
	wg.Wait()
	close(results)

	// Analyze results
	successCount := 0
	quotaFullCount := 0
	otherErrors := 0

	for err := range results {
		if err == nil {
			successCount++
		} else if err.Error() == "appointment quota for this schedule is full" {
			quotaFullCount++
		} else {
			otherErrors++
			t.Logf("Unexpected error: %v", err)
		}
	}

	// Assertions
	assert.Equal(t, 10, successCount, "Expected exactly 10 successful bookings")
	assert.Equal(t, 10, quotaFullCount, "Expected exactly 10 quota full errors")
	assert.Equal(t, 0, otherErrors, "Expected no other errors")

	// Verify database state
	var dbCount int64
	db.Model(&entity.Appointment{}).
		Where("schedule_id = ? AND appointment_date = ?", schedule.ID, appointmentDate).
		Count(&dbCount)

	assert.Equal(t, int64(10), dbCount, "Database should have exactly 10 appointments")

	// Verify queue numbers are sequential and unique
	var appointments []entity.Appointment
	db.Where("schedule_id = ? AND appointment_date = ?", schedule.ID, appointmentDate).
		Order("queue_number").
		Find(&appointments)

	queueNumbers := make(map[int]bool)
	for i, app := range appointments {
		assert.Equal(t, i+1, app.QueueNumber, "Queue numbers should be sequential starting from 1")
		assert.False(t, queueNumbers[app.QueueNumber], "Queue numbers should be unique")
		queueNumbers[app.QueueNumber] = true
	}
}

// TestDatabaseConstraintPreventsDoubleBooking verifies the unique constraint works
func TestDatabaseConstraintPreventsDoubleBooking(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	doctor := createTestDoctor(t, db)
	schedule := createTestSchedule(t, db, doctor.ID, 10)
	patient := createTestPatient(t, db, 1)
	appointmentDate, _ := time.Parse("2006-01-02", time.Now().AddDate(0, 0, 7).Format("2006-01-02"))

	// Create first appointment
	appointment1 := &entity.Appointment{
		ID:              uuid.New(),
		PatientID:       patient.ID,
		DoctorID:        doctor.ID,
		ScheduleID:      schedule.ID,
		AppointmentDate: appointmentDate,
		QueueNumber:     1,
		Status:          entity.StatusWaiting,
	}
	err := db.Create(appointment1).Error
	assert.NoError(t, err, "First appointment should succeed")

	// Try to create duplicate appointment (same patient, schedule, date)
	appointment2 := &entity.Appointment{
		ID:              uuid.New(),
		PatientID:       patient.ID,
		DoctorID:        doctor.ID,
		ScheduleID:      schedule.ID,
		AppointmentDate: appointmentDate,
		QueueNumber:     2,
		Status:          entity.StatusWaiting,
	}
	err = db.Create(appointment2).Error
	assert.Error(t, err, "Duplicate appointment should fail due to unique constraint")
	assert.Contains(t, err.Error(), "unique", "Error should mention unique constraint violation")
}

// Helper functions

func setupTestDB(t *testing.T) *gorm.DB {
	// Use test database connection
	// To run this test, create a test database:
	// CREATE DATABASE mediqueue_test;
	// CREATE USER test WITH PASSWORD 'test';
	// GRANT ALL PRIVILEGES ON DATABASE mediqueue_test TO test;
	dsn := "host=localhost user=test password=test dbname=mediqueue_test port=5432 sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Skipf("Skipping test - test database not available: %v", err)
		return nil
	}

	// Auto migrate
	db.AutoMigrate(&entity.User{}, &entity.Patient{}, &entity.Doctor{}, 
		&entity.DoctorSchedule{}, &entity.Appointment{})

	return db
}

func cleanupTestDB(t *testing.T, db *gorm.DB) {
	// Clean up test data
	db.Exec("TRUNCATE appointments, doctor_schedules, doctors, patients, users, roles CASCADE")
}

func createTestDoctor(t *testing.T, db *gorm.DB) *entity.Doctor {
	// Create or get Doctor role
	var doctorRole entity.Role
	db.FirstOrCreate(&doctorRole, entity.Role{RoleName: "Doctor"})

	user := &entity.User{
		ID:           uuid.New(),
		Username:     "doctor_test",
		Email:        "doctor@test.com",
		PasswordHash: "hashed",
		RoleID:       doctorRole.ID,
		IsActive:     true,
	}
	db.Create(user)

	doctor := &entity.Doctor{
		ID:             uuid.New(),
		UserID:         user.ID,
		FullName:       "Dr. Test",
		Phone:          "08123456789",
		Specialization: "General",
		SIPNumber:      "DOC123",
	}
	db.Create(doctor)

	return doctor
}

func createTestSchedule(t *testing.T, db *gorm.DB, doctorID uuid.UUID, maxPatient int) *entity.DoctorSchedule {
	schedule := &entity.DoctorSchedule{
		ID:         uuid.New(),
		DoctorID:   doctorID,
		DayOfWeek:  int(time.Now().AddDate(0, 0, 7).Weekday()),
		StartTime:  "09:00",
		EndTime:    "17:00",
		MaxPatient: maxPatient,
		IsActive:   true,
	}
	db.Create(schedule)

	return schedule
}

func createTestPatient(t *testing.T, db *gorm.DB, index int) *entity.Patient {
	// Create or get Patient role
	var patientRole entity.Role
	db.FirstOrCreate(&patientRole, entity.Role{RoleName: "Patient"})

	user := &entity.User{
		ID:           uuid.New(),
		Username:     "patient_test_" + string(rune(index)),
		Email:        "patient" + string(rune(index)) + "@test.com",
		PasswordHash: "hashed",
		RoleID:       patientRole.ID,
		IsActive:     true,
	}
	db.Create(user)

	nik := "1234567890" + string(rune(index))
	patient := &entity.Patient{
		ID:        uuid.New(),
		UserID:    user.ID,
		FullName:  "Patient " + string(rune(index)),
		Phone:     "08123456789",
		NIK:       &nik,
		Gender:    entity.GenderMale,
		Address:   "Test Address",
		BloodType: entity.BloodTypeO,
	}
	db.Create(patient)

	return patient
}
