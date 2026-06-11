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
	seedRoles(db)
	seedAdmin(db, cfg)
	seedDemoDoctor(db)
	log.Println("Seeding completed")
}

func seedRoles(db *gorm.DB) {
	roles := []string{"Admin", "Doctor", "Patient"}
	for _, roleName := range roles {
		var count int64
		db.Model(&entity.Role{}).Where("role_name = ?", roleName).Count(&count)
		if count == 0 {
			role := entity.Role{
				ID:       uuid.New(),
				RoleName: roleName,
			}
			if err := db.Create(&role).Error; err != nil {
				log.Printf("Failed to seed role %s: %v", roleName, err)
			} else {
				log.Printf("Role seeded: %s", roleName)
			}
		}
	}
}

func seedAdmin(db *gorm.DB, cfg *config.Config) {
	var count int64
	db.Model(&entity.User{}).Where("email = ?", cfg.AdminEmail).Count(&count)
	if count > 0 {
		log.Println("Admin already seeded, skipping...")
		return
	}

	var adminRole entity.Role
	if err := db.Where("role_name = ?", "Admin").First(&adminRole).Error; err != nil {
		log.Printf("Failed to find admin role: %v", err)
		return
	}

	hash, err := utils.HashPassword(cfg.AdminPassword)
	if err != nil {
		log.Printf("Failed to hash admin password: %v", err)
		return
	}

	admin := entity.User{
		ID:           uuid.New(),
		Username:     "admin",
		Email:        cfg.AdminEmail,
		PasswordHash: hash,
		RoleID:       adminRole.ID,
		IsActive:     true,
	}

	if err := db.Create(&admin).Error; err != nil {
		log.Printf("Failed to seed admin: %v", err)
		return
	}

	log.Printf("Admin seeded: %s", cfg.AdminEmail)
}

func seedDemoDoctor(db *gorm.DB) {
	var count int64
	db.Model(&entity.Doctor{}).Count(&count)
	if count > 0 {
		log.Println("Doctor already seeded, skipping...")
		return
	}

	var doctorRole entity.Role
	if err := db.Where("role_name = ?", "Doctor").First(&doctorRole).Error; err != nil {
		log.Printf("Failed to find doctor role: %v", err)
		return
	}

	hash, _ := utils.HashPassword("Doctor@123")
	doctorUser := entity.User{
		ID:           uuid.New(),
		Username:     "drbudi",
		Email:        "doctor@mediqueue.com",
		PasswordHash: hash,
		RoleID:       doctorRole.ID,
		IsActive:     true,
	}
	db.Create(&doctorUser)

	doctor := entity.Doctor{
		ID:             uuid.New(),
		UserID:         doctorUser.ID,
		FullName:       "Dr. Budi Santoso",
		Phone:          "081234567890",
		Specialization: "Dokter Umum",
		SIPNumber:      "SIP-001-2024",
	}
	db.Create(&doctor)

	for _, day := range []int{1, 3, 5} {
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
