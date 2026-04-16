package database

import (
	"log"

	"mediqueue/config"
	"mediqueue/internal/entity"
	"mediqueue/pkg/utils"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func Seed(db *gorm.DB, cfg *config.Config) {
	log.Println("Running database seeder...")
	seedAdmin(db, cfg)
	seedDemoDoctor(db)
	log.Println("Seeding completed")
}

func seedAdmin(db *gorm.DB, cfg *config.Config) {
	var count int64
	db.Model(&entity.User{}).Where("email = ?", cfg.AdminEmail).Count(&count)
	if count > 0 {
		log.Println("Admin already seeded, skipping...")
		return
	}

	hash, err := utils.HashPassword(cfg.AdminPassword)
	if err != nil {
		log.Printf("Failed to hash admin password: %v", err)
		return
	}

	admin := entity.User{
		ID:           uuid.New(),
		Email:        cfg.AdminEmail,
		PasswordHash: hash,
		Role:         entity.RoleAdmin,
		FullName:     cfg.AdminName,
		IsActive:     true,
	}

	if err := db.Create(&admin).Error; err != nil {
		log.Printf("Failed to seed admin: %v", err)
		return
	}

	log.Printf("Admin seeded: %s / %s", cfg.AdminEmail, cfg.AdminPassword)
}

func seedDemoDoctor(db *gorm.DB) {
	var count int64
	db.Model(&entity.Doctor{}).Count(&count)
	if count > 0 {
		log.Println("Doctor already seeded, skipping...")
		return
	}

	hash, _ := utils.HashPassword("Doctor@123")
	doctorUser := entity.User{
		ID:           uuid.New(),
		Email:        "doctor@mediqueue.com",
		PasswordHash: hash,
		Role:         entity.RoleDoctor,
		FullName:     "Dr. Budi Santoso",
		Phone:        "081234567890",
		IsActive:     true,
	}
	db.Create(&doctorUser)

	doctor := entity.Doctor{
		ID:             uuid.New(),
		UserID:         doctorUser.ID,
		Specialization: "Dokter Umum",
		SIPNumber:      "SIP-001-2024",
	}
	db.Create(&doctor)

	// Monday & Wednesday schedule
	for _, day := range []int{1, 3} {
		schedule := entity.DoctorSchedule{
			ID:         uuid.New(),
			DoctorID:   doctor.ID,
			DayOfWeek:  day,
			StartTime:  "08:00",
			EndTime:    "12:00",
			MaxPatient: 20,
			IsActive:   true,
		}
		db.Create(&schedule)
	}

	log.Printf("Demo doctor seeded: doctor@mediqueue.com / Doctor@123")
}
