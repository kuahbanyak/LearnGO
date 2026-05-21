import { z } from 'zod'

/**
 * Password schema with complexity validation.
 * Requires: min 8 chars, at least one letter, at least one digit, confirmation must match.
 * Validates: Requirement 2.5, 20.5
 */
export const passwordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one digit'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

/**
 * Schedule entry schema for doctor weekly schedule management.
 * Validates: start time < end time, slot duration 5-120 min, max patients 1-50.
 * Validates: Requirement 7.4
 */
export const scheduleEntrySchema = z.object({
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  slotDuration: z.number()
    .min(5, 'Slot duration must be at least 5 minutes')
    .max(120, 'Slot duration must be at most 120 minutes'),
  maxPatients: z.number()
    .min(1, 'Maximum patients must be at least 1')
    .max(50, 'Maximum patients must be at most 50'),
}).refine((data) => data.startTime < data.endTime, {
  message: 'Start time must be earlier than end time',
  path: ['startTime'],
})

/**
 * Medical record schema for doctor consultation documentation.
 * Validates: chief complaint, diagnosis, treatment plan non-empty, max 5000 chars each.
 * Validates: Requirement 15.6
 */
export const medicalRecordSchema = z.object({
  chiefComplaint: z.string()
    .min(1, 'Chief complaint is required')
    .max(5000, 'Chief complaint must be at most 5000 characters'),
  diagnosis: z.string()
    .min(1, 'Diagnosis is required')
    .max(5000, 'Diagnosis must be at most 5000 characters'),
  treatmentPlan: z.string()
    .min(1, 'Treatment plan is required')
    .max(5000, 'Treatment plan must be at most 5000 characters'),
})

/**
 * Cancellation schema for appointment cancellation.
 * Validates: reason at least 10 characters.
 * Validates: Requirement 9.4
 */
export const cancellationSchema = z.object({
  reason: z.string()
    .min(10, 'Cancellation reason must be at least 10 characters'),
})

/**
 * Rating schema for patient doctor visit ratings.
 * Validates: 1-5 stars, optional comment max 1000 chars.
 * Validates: Requirement 19.4
 */
export const ratingSchema = z.object({
  stars: z.number()
    .min(1, 'Rating must be at least 1 star')
    .max(5, 'Rating must be at most 5 stars'),
  comment: z.string()
    .max(1000, 'Comment must be at most 1000 characters')
    .optional(),
})

/**
 * Delete account schema requiring explicit "DELETE" confirmation.
 * Validates: Requirement 20.5, 20.6
 */
export const deleteAccountSchema = z.object({
  confirmation: z.string().refine((val) => val === 'DELETE', {
    message: 'You must type "DELETE" to confirm account deletion',
  }),
})

// Inferred types for form usage with react-hook-form
export type PasswordFormData = z.infer<typeof passwordSchema>
export type ScheduleEntryFormData = z.infer<typeof scheduleEntrySchema>
export type MedicalRecordFormData = z.infer<typeof medicalRecordSchema>
export type CancellationFormData = z.infer<typeof cancellationSchema>
export type RatingFormData = z.infer<typeof ratingSchema>
export type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>
