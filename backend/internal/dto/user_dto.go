package dto

import "github.com/google/uuid"

type UpdateUserRequest struct {
	FullName  string `json:"full_name" binding:"required"`
	Phone     string `json:"phone" binding:"omitempty"`
	NIK       string `json:"nik" binding:"omitempty"`
	Gender    string `json:"gender" binding:"omitempty"`
	Address   string `json:"address" binding:"omitempty"`
	BloodType string `json:"blood_type" binding:"omitempty"`
	IsActive  *bool  `json:"is_active" binding:"omitempty"`
}

type UserResponse struct {
	ID        uuid.UUID `json:"id"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	FullName  string    `json:"full_name"`
	Phone     string    `json:"phone"`
	NIK       string    `json:"nik"`
	Gender    string    `json:"gender"`
	Address   string    `json:"address"`
	BloodType string    `json:"blood_type"`
	IsActive  bool      `json:"is_active"`
	CreatedAt string    `json:"created_at"`
	UpdatedAt string    `json:"updated_at"`
}
