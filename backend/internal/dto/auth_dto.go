package dto

// ========================
// AUTH DTOs
// ========================

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	FullName string `json:"full_name" binding:"required"`
	Phone     string `json:"phone"`
	NIK       string `json:"nik"`
	Gender    string `json:"gender"`
	Address   string `json:"address"`
	BloodType string `json:"blood_type"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string      `json:"token"`
	User  interface{} `json:"user"`
}

type UpdateProfileRequest struct {
	FullName  string `json:"full_name"`
	Phone     string `json:"phone"`
	NIK       string `json:"nik"`
	Gender    string `json:"gender"`
	Address   string `json:"address"`
	BloodType string `json:"blood_type"`
}

// ========================
// PATIENT DTOs
// ========================

type UpdatePatientRequest struct {
	NIK         string `json:"nik"`
	DateOfBirth string `json:"date_of_birth"` // "YYYY-MM-DD"
	Gender      string `json:"gender"`
	Address     string `json:"address"`
	BloodType   string `json:"blood_type"`
	Allergies   string `json:"allergies"`
}
