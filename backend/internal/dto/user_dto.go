package dto

import "github.com/google/uuid"

type UpdateUserRequest struct {
	Username string `json:"username" binding:"omitempty,min=3"`
	Email    string `json:"email" binding:"omitempty,email"`
	IsActive *bool  `json:"is_active" binding:"omitempty"`
}

type UserResponse struct {
	ID        uuid.UUID `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	IsActive  bool      `json:"is_active"`
	CreatedAt string    `json:"created_at"`
	UpdatedAt string    `json:"updated_at"`
}

type UserDetailResponse struct {
	ID        uuid.UUID     `json:"id"`
	Username  string        `json:"username"`
	Email     string        `json:"email"`
	Role      string        `json:"role"`
	IsActive  bool          `json:"is_active"`
	Patient   *PatientDTO   `json:"patient,omitempty"`
	Doctor    *DoctorDTO    `json:"doctor,omitempty"`
	CreatedAt string        `json:"created_at"`
	UpdatedAt string        `json:"updated_at"`
}

type PatientDTO struct {
	ID          uuid.UUID `json:"id"`
	FullName    string    `json:"full_name"`
	Phone       string    `json:"phone"`
	NIK         *string   `json:"nik"`
	DateOfBirth *string   `json:"date_of_birth"`
	Gender      string    `json:"gender"`
	Address     string    `json:"address"`
	BloodType   string    `json:"blood_type"`
	Allergies   string    `json:"allergies"`
}

type DoctorDTO struct {
	ID             uuid.UUID `json:"id"`
	FullName       string    `json:"full_name"`
	Phone          string    `json:"phone"`
	Specialization string    `json:"specialization"`
	SIPNumber      string    `json:"sip_number"`
}
