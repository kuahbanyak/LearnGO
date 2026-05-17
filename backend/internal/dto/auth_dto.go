package dto

import (
	"errors"
	"regexp"
)

// ========================
// AUTH DTOs
// ========================

type RegisterRequest struct {
	Username  string `json:"username" binding:"required,min=3"`
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=8"`
	FullName  string `json:"full_name" binding:"required"`
	Phone     string `json:"phone"`
	NIK       string `json:"nik"`
	Gender    string `json:"gender"`
	Address   string `json:"address"`
	BloodType string `json:"blood_type"`
}

// Validate performs additional password complexity validation
func (r *RegisterRequest) Validate() error {
	if len(r.Password) < 8 {
		return errors.New("password must be at least 8 characters")
	}

	// Check for uppercase letter
	if !regexp.MustCompile(`[A-Z]`).MatchString(r.Password) {
		return errors.New("password must contain at least one uppercase letter")
	}

	// Check for lowercase letter
	if !regexp.MustCompile(`[a-z]`).MatchString(r.Password) {
		return errors.New("password must contain at least one lowercase letter")
	}

	// Check for number
	if !regexp.MustCompile(`[0-9]`).MatchString(r.Password) {
		return errors.New("password must contain at least one number")
	}

	return nil
}

type LoginRequest struct {
	Login    string `json:"login" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string      `json:"token"`
	User  interface{} `json:"user"`
}

type UpdateProfileRequest struct {
	FullName    string `json:"full_name"`
	Phone       string `json:"phone"`
	NIK         string `json:"nik"`
	DateOfBirth string `json:"date_of_birth"`
	Gender      string `json:"gender"`
	Address     string `json:"address"`
	BloodType   string `json:"blood_type"`
	Allergies   string `json:"allergies"`
}

// ========================
// PATIENT DTOs
// ========================

type UpdatePatientRequest struct {
	FullName    string `json:"full_name"`
	Phone       string `json:"phone"`
	NIK         string `json:"nik"`
	DateOfBirth string `json:"date_of_birth"`
	Gender      string `json:"gender"`
	Address     string `json:"address"`
	BloodType   string `json:"blood_type"`
	Allergies   string `json:"allergies"`
}
