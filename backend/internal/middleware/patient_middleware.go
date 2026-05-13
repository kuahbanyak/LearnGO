package middleware

import (
	"mediqueue/internal/repository"
	"mediqueue/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// RequirePatientProfile ensures the authenticated user has a patient profile
func RequirePatientProfile(patientRepo repository.PatientRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		claims := GetCurrentUser(c)
		if claims == nil {
			response.Unauthorized(c, "Unauthorized")
			c.Abort()
			return
		}

		userID, err := uuid.Parse(claims.UserID)
		if err != nil {
			response.BadRequest(c, "Invalid user ID")
			c.Abort()
			return
		}

		// Check if patient profile exists
		patient, err := patientRepo.FindByUserID(userID)
		if err != nil || patient == nil {
			response.BadRequest(c, "Patient profile not found. Please contact support.")
			c.Abort()
			return
		}

		// Store patient ID in context for later use
		c.Set("patientID", patient.ID.String())
		c.Next()
	}
}
