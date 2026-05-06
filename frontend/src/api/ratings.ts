import apiClient from './client'
import type { ApiResponse, PaginatedResponse } from '@/types'

export interface Rating {
  id: string
  appointment_id: string
  score: number
  comment?: string
  patient_name?: string
  created_at: string
}

export interface DoctorRatingSummary {
  doctor_id: string
  doctor_name: string
  average_score: number
  total_ratings: number
}

export const ratingsApi = {
  create: (data: { appointment_id: string; score: number; comment?: string }) =>
    apiClient.post<ApiResponse<Rating>>('/ratings', data),

  getByDoctor: (doctorId: string, params?: { page?: number; per_page?: number }) =>
    apiClient.get<PaginatedResponse<Rating>>(`/ratings/doctor/${doctorId}`, { params }),

  getDoctorSummary: (doctorId: string) =>
    apiClient.get<ApiResponse<DoctorRatingSummary>>(`/ratings/doctor/${doctorId}/summary`),
}
