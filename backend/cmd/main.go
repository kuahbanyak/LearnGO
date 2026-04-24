package main

import (
	"log"

	"mediqueue/config"
	"mediqueue/infrastructure/database"
	"mediqueue/internal/entity"
	"mediqueue/internal/handler"
	"mediqueue/internal/middleware"
	"mediqueue/internal/repository"
	"mediqueue/internal/usecase"
	"mediqueue/pkg/utils"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize JWT
	utils.InitJWT(cfg.JWTSecret)

	// Connect database
	db := database.Connect(cfg)

	// Run migrations
	database.Migrate(db)

	// Run seeder
	database.Seed(db, cfg)

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	patientRepo := repository.NewPatientRepository(db)
	doctorRepo := repository.NewDoctorRepository(db)
	scheduleRepo := repository.NewScheduleRepository(db)
	appointmentRepo := repository.NewAppointmentRepository(db)
	medRecordRepo := repository.NewMedicalRecordRepository(db)

	// Initialize use cases
	authUC := usecase.NewAuthUsecase(userRepo, patientRepo)
	patientUC := usecase.NewPatientUsecase(patientRepo)
	doctorUC := usecase.NewDoctorUsecase(doctorRepo, userRepo)
	scheduleUC := usecase.NewScheduleUsecase(scheduleRepo, doctorRepo)
	appointmentUC := usecase.NewAppointmentUsecase(appointmentRepo, scheduleRepo, patientRepo, doctorRepo)
	medRecordUC := usecase.NewMedicalRecordUsecase(medRecordRepo, appointmentRepo, doctorRepo)
	dashboardUC := usecase.NewDashboardUsecase(db, doctorRepo, patientRepo)
	userUC := usecase.NewUserUsecase(userRepo)

	// Initialize handlers
	authH := handler.NewAuthHandler(authUC, cfg.JWTExpiryHours)
	patientH := handler.NewPatientHandler(patientUC)
	doctorH := handler.NewDoctorHandler(doctorUC)
	scheduleH := handler.NewScheduleHandler(scheduleUC)
	appointmentH := handler.NewAppointmentHandler(appointmentUC)
	medRecordH := handler.NewMedicalRecordHandler(medRecordUC, patientRepo)
	dashboardH := handler.NewDashboardHandler(dashboardUC)
	userH := handler.NewUserHandler(userUC)

	// Setup Gin
	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// CORS
	corsOrigins := []string{"http://localhost:5173", "http://localhost:3000", "http://localhost:4173"}
	if cfg.AppEnv == "production" {
		corsOrigins = []string{"*"}
	}
	r.Use(cors.New(cors.Config{
		AllowOrigins:     corsOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: cfg.AppEnv != "production",
	}))

	// API v1
	api := r.Group("/api/v1")

	// ── Auth routes (public) ──
	auth := api.Group("/auth")
	{
		auth.POST("/register", authH.Register)
		auth.POST("/login", authH.Login)
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
	adminOnly.Use(middleware.RequireRole(entity.RoleAdmin))
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
	}

	// ── Admin or Doctor ──
	adminOrDoctor := protected.Group("/")
	adminOrDoctor.Use(middleware.RequireRole(entity.RoleAdmin, entity.RoleDoctor))
	{
		adminOrDoctor.GET("/patients", patientH.GetAll)
		adminOrDoctor.GET("/patients/:id", patientH.GetByID)
	}

	// ── Doctor routes ──
	doctorOnly := protected.Group("/")
	doctorOnly.Use(middleware.RequireRole(entity.RoleDoctor))
	{
		doctorOnly.GET("/appointments/today", appointmentH.GetTodayQueue)
		doctorOnly.PATCH("/appointments/:id/status", appointmentH.UpdateStatus)
		doctorOnly.POST("/medical-records", medRecordH.Create)
		doctorOnly.GET("/medical-records/patient/:id", medRecordH.GetByPatient)
		doctorOnly.GET("/dashboard/doctor", dashboardH.GetDoctorStats)
	}

	// ── Patient routes ──
	patientOnly := protected.Group("/")
	patientOnly.Use(middleware.RequireRole(entity.RolePatient))
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
	protected.GET("/medical-records/:id", medRecordH.GetByID)

	// Schedule toggle: admin + doctor
	protected.Use(middleware.RequireRole(entity.RoleAdmin, entity.RoleDoctor)).
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
