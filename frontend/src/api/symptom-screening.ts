import apiClient from './client'
import type { ApiResponse } from '@/types'

export interface SymptomScreening {
  id: string
  appointment_id: string
  symptoms: string[]
  severity: 'mild' | 'moderate' | 'severe'
  additional_notes?: string
  duration?: string
  temperature?: string
  ai_summary?: string
  created_at: string
}

export const symptomScreeningApi = {
  create: (data: {
    appointment_id: string
    symptoms: string[]
    severity: string
    additional_notes?: string
    duration?: string
    temperature?: string
  }) => apiClient.post<ApiResponse<SymptomScreening>>('/symptom-screenings', data),

  getByAppointment: (appointmentId: string) =>
    apiClient.get<ApiResponse<SymptomScreening>>(`/appointments/${appointmentId}/symptoms`),

  getMyScreenings: () =>
    apiClient.get<ApiResponse<{ total: number; items: SymptomScreening[] }>>('/symptom-screenings/my'),
}
