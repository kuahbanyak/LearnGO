package main

import (
	"log"

	"mediqueue/config"
	"mediqueue/infrastructure/database"
	"mediqueue/internal/handler"
	"mediqueue/internal/middleware"
	"mediqueue/internal/repository"
	"mediqueue/internal/usecase"
	"mediqueue/internal/ws"
	"mediqueue/pkg/logger"
	"mediqueue/pkg/utils"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Validate configuration
	if err := cfg.Validate(); err != nil {
		log.Fatalf("Configuration validation failed: %v", err)
	}

	// Initialize logger
	if err := logger.Init(cfg.AppEnv); err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer logger.Sync()

	logger.Info("Starting MediQueue API")

	// Initialize JWT
	utils.InitJWT(cfg.JWTSecret)

	// Connect database
	db := database.Connect(cfg)

	// Run schema migrations
	database.Migrate(db)

	// Create database indexes for performance
	if err := database.CreateIndexes(db); err != nil {
		logger.Warn("Some indexes failed to create, continuing anyway")
	}

	// Run seeder
	database.Seed(db, cfg)

	// Initialize WebSocket hub
	hub := ws.NewHub()
	go hub.Run()

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	patientRepo := repository.NewPatientRepository(db)
	doctorRepo := repository.NewDoctorRepository(db)
	scheduleRepo := repository.NewScheduleRepository(db)
	appointmentRepo := repository.NewAppointmentRepository(db)
	medRecordRepo := repository.NewMedicalRecordRepository(db)
	ratingRepo := repository.NewRatingRepository(db)
	checkInTokenRepo := repository.NewCheckInTokenRepository(db)
	symptomScreeningRepo := repository.NewSymptomScreeningRepository(db)
	roleRepo := repository.NewRoleRepository(db)

	// Initialize use cases
	authUC := usecase.NewAuthUsecase(userRepo, patientRepo, roleRepo, db)
	patientUC := usecase.NewPatientUsecase(patientRepo)
	doctorUC := usecase.NewDoctorUsecase(doctorRepo, userRepo, roleRepo)
	scheduleUC := usecase.NewScheduleUsecase(scheduleRepo, doctorRepo)
	appointmentUC := usecase.NewAppointmentUsecase(appointmentRepo, scheduleRepo, patientRepo, doctorRepo, db)
	medRecordUC := usecase.NewMedicalRecordUsecase(medRecordRepo, appointmentRepo, doctorRepo)
	dashboardUC := usecase.NewDashboardUsecase(db, doctorRepo, patientRepo)
	userUC := usecase.NewUserUsecase(userRepo)
	analyticsUC := usecase.NewAnalyticsUsecase(db)
	ratingUC := usecase.NewRatingUsecase(ratingRepo, appointmentRepo, patientRepo, doctorRepo)
	checkInUC := usecase.NewCheckInUsecase(checkInTokenRepo, appointmentRepo)
	symptomScreeningUC := usecase.NewSymptomScreeningUsecase(symptomScreeningRepo, appointmentRepo, patientRepo)

	// Initialize handlers
	authH := handler.NewAuthHandler(authUC, cfg.JWTExpiryHours)
	patientH := handler.NewPatientHandler(patientUC)
	doctorH := handler.NewDoctorHandler(doctorUC)
	scheduleH := handler.NewScheduleHandler(scheduleUC)
	appointmentH := handler.NewAppointmentHandler(appointmentUC)
	medRecordH := handler.NewMedicalRecordHandler(medRecordUC, patientRepo)
	dashboardH := handler.NewDashboardHandler(dashboardUC)
	userH := handler.NewUserHandler(userUC)
	analyticsH := handler.NewAnalyticsHandler(analyticsUC)
	ratingH := handler.NewRatingHandler(ratingUC)
	wsH := handler.NewWebSocketHandler(hub)
	checkInH := handler.NewCheckInHandler(checkInUC)
	exportH := handler.NewExportHandler(appointmentRepo)
	symptomScreeningH := handler.NewSymptomScreeningHandler(symptomScreeningUC)
	medRecordExportH := handler.NewMedicalRecordExportHandler(medRecordRepo)

	// Setup Gin
	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// Global middleware
	r.Use(middleware.RequestIDMiddleware()) // Add request ID to all requests

	// CORS - Use configuration method
	corsOrigins := cfg.GetAllowedOrigins()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     corsOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-Request-ID"},
		ExposeHeaders:    []string{"X-Request-ID"},
		AllowCredentials: cfg.AppEnv != "production",
	}))

	// WebSocket endpoint (before API group)
	r.GET("/api/v1/ws", wsH.HandleConnection)

	// API v1
	api := r.Group("/api/v1")

	// ── Auth routes (public) ──
	auth := api.Group("/auth")
	{
		auth.POST("/register", middleware.RateLimitMiddleware(3), authH.Register)
		auth.POST("/login", middleware.RateLimitMiddleware(5), authH.Login)
		auth.GET("/me", middleware.AuthMiddleware(), authH.GetProfile)
		auth.PUT("/profile", middleware.AuthMiddleware(), authH.UpdateProfile)
		auth.DELETE("/me", middleware.AuthMiddleware(), authH.DeleteProfile)
	}

	// ── Authenticated routes ──
	protected := api.Group("/")
	protected.Use(middleware.AuthMiddleware())

	// Doctors (public read)
	protected.GET("/doctors", doctorH.GetAll)
	protected.GET("/doctors/:id", doctorH.GetByID)

	// Schedules (public read)
	protected.GET("/schedules", scheduleH.GetAll)
	protected.GET("/schedules/doctor/:id", scheduleH.GetByDoctor)

	// ── Admin only ──
	adminOnly := protected.Group("/")
	adminOnly.Use(middleware.RequireRole("Admin"))
	{
		// Doctor management
		adminOnly.POST("/doctors", doctorH.Create)
		adminOnly.PUT("/doctors/:id", doctorH.Update)
		adminOnly.DELETE("/doctors/:id", doctorH.Delete)

		// Schedule management
		adminOnly.POST("/schedules", scheduleH.Create)
		adminOnly.PUT("/schedules/:id", scheduleH.Update)
		adminOnly.DELETE("/schedules/:id", scheduleH.Delete)

		// Appointments (admin view all)
		adminOnly.GET("/appointments", appointmentH.GetAll)

		// Dashboard
		adminOnly.GET("/dashboard/admin", dashboardH.GetAdminStats)

		// User management
		adminOnly.GET("/users", userH.GetAll)
		adminOnly.GET("/users/:id", userH.GetByID)
		adminOnly.PUT("/users/:id", userH.Update)
		adminOnly.DELETE("/users/:id", userH.Delete)

		// Analytics
		adminOnly.GET("/analytics", analyticsH.GetAnalytics)

		// Export
		adminOnly.GET("/export/appointments", exportH.ExportAppointments)
	}

	// ── Admin or Doctor ──
	adminOrDoctor := protected.Group("/")
	adminOrDoctor.Use(middleware.RequireRole("Admin", "Doctor"))
	{
		adminOrDoctor.GET("/patients", patientH.GetAll)
		adminOrDoctor.GET("/patients/:id", patientH.GetByID)
	}

	// ── Doctor routes ──
	doctorOnly := protected.Group("/")
	doctorOnly.Use(middleware.RequireRole("Doctor"))
	{
		doctorOnly.GET("/appointments/today", appointmentH.GetTodayQueue)
		doctorOnly.PATCH("/appointments/:id/status", appointmentH.UpdateStatus)
		doctorOnly.POST("/medical-records", medRecordH.Create)
		doctorOnly.GET("/medical-records/patient/:id", medRecordH.GetByPatient)
		doctorOnly.GET("/dashboard/doctor", dashboardH.GetDoctorStats)
	}

	// ── Patient routes ──
	patientOnly := protected.Group("/")
	patientOnly.Use(middleware.RequireRole("Patient"))
	patientOnly.Use(middleware.RequirePatientProfile(patientRepo))
	{
		patientOnly.POST("/appointments", appointmentH.Book)
		patientOnly.GET("/appointments/my", appointmentH.GetMyAppointments)
		patientOnly.PUT("/patients/profile", patientH.UpdateMyProfile)
		patientOnly.GET("/dashboard/patient", dashboardH.GetPatientStats)
		patientOnly.GET("/medical-records/my", medRecordH.GetMyMedicalRecords)
	}

	// Shared: appointment detail + cancel
	protected.GET("/appointments/:id", appointmentH.GetByID)
	protected.PATCH("/appointments/:id/cancel", appointmentH.Cancel)
	protected.PATCH("/appointments/:id/reschedule", appointmentH.RescheduleAppointment)
	protected.GET("/medical-records/:id", medRecordH.GetByID)
	protected.GET("/medical-records/:id/pdf", medRecordExportH.ExportPDF)

	// Ratings (patient creates, all can view)
	patientOnly.POST("/ratings", ratingH.Create)
	protected.GET("/ratings/doctor/:id", ratingH.GetByDoctor)
	protected.GET("/ratings/doctor/:id/summary", ratingH.GetDoctorSummary)

	// QR Check-in
	protected.GET("/appointments/:id/qr", checkInH.GetQRCode) // Patient/Admin
	protected.GET("/appointments/:id/check-in-status", checkInH.GetCheckInStatus)
	r.PATCH("/api/v1/check-in/:token", checkInH.CheckIn) // Public endpoint for scanning

	// Symptom Screening
	protected.POST("/symptom-screenings", symptomScreeningH.Create)
	protected.GET("/symptom-screenings/my", symptomScreeningH.GetMyScreenings)
	protected.GET("/appointments/:id/symptoms", symptomScreeningH.GetByAppointment)

	// Schedule toggle: admin + doctor
	protected.Use(middleware.RequireRole("Admin", "Doctor")).
		PATCH("/schedules/:id/toggle", scheduleH.Toggle)

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "MediQueue API"})
	})

	log.Printf("🏥 MediQueue API running on port %s", cfg.AppPort)
	if err := r.Run(":" + cfg.AppPort); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
