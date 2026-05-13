package errors

import "fmt"

// AppError represents an application error with a code
type AppError struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

func (e *AppError) Error() string {
	return e.Message
}

// Error codes
const (
	ErrCodeValidation        = "VALIDATION_ERROR"
	ErrCodeUnauthorized      = "UNAUTHORIZED"
	ErrCodeForbidden         = "FORBIDDEN"
	ErrCodeNotFound          = "NOT_FOUND"
	ErrCodeDuplicate         = "DUPLICATE_ENTRY"
	ErrCodeQuotaExceeded     = "QUOTA_EXCEEDED"
	ErrCodeInvalidStatus     = "INVALID_STATUS"
	ErrCodeInvalidTransition = "INVALID_TRANSITION"
	ErrCodeProfileIncomplete = "PROFILE_INCOMPLETE"
	ErrCodeInternal          = "INTERNAL_ERROR"
)

// Constructor functions
func NewValidationError(message string) *AppError {
	return &AppError{Code: ErrCodeValidation, Message: message}
}

func NewUnauthorizedError(message string) *AppError {
	return &AppError{Code: ErrCodeUnauthorized, Message: message}
}

func NewForbiddenError(message string) *AppError {
	return &AppError{Code: ErrCodeForbidden, Message: message}
}

func NewNotFoundError(message string) *AppError {
	return &AppError{Code: ErrCodeNotFound, Message: message}
}

func NewDuplicateError(message string) *AppError {
	return &AppError{Code: ErrCodeDuplicate, Message: message}
}

func NewQuotaExceededError(message string) *AppError {
	return &AppError{Code: ErrCodeQuotaExceeded, Message: message}
}

func NewInvalidStatusError(message string) *AppError {
	return &AppError{Code: ErrCodeInvalidStatus, Message: message}
}

func NewInvalidTransitionError(message string) *AppError {
	return &AppError{Code: ErrCodeInvalidTransition, Message: message}
}

func NewProfileIncompleteError(message string) *AppError {
	return &AppError{Code: ErrCodeProfileIncomplete, Message: message}
}

func NewInternalError(message string) *AppError {
	return &AppError{Code: ErrCodeInternal, Message: message}
}

// WithDetails adds details to an error
func (e *AppError) WithDetails(details interface{}) *AppError {
	e.Details = details
	return e
}

// Wrap wraps an error with additional context
func Wrap(err error, message string) error {
	if err == nil {
		return nil
	}
	return fmt.Errorf("%s: %w", message, err)
}
