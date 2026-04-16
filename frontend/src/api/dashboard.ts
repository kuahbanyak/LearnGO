import apiClient from './client'
import type { ApiResponse, DashboardStats, PaginatedResponse, Patient } from '@/types'

export const dashboardApi = {
  getAdminStats: () => apiClient.get<ApiResponse<DashboardStats>>('/dashboard/admin'),
  getDoctorStats: () => apiClient.get<ApiResponse<DashboardStats>>('/dashboard/doctor'),
  getPatientStats: () => apiClient.get<ApiResponse<DashboardStats>>('/dashboard/patient'),
}

export const patientApi = {
  getAll: (params?: { page?: number; per_page?: number; search?: string }) =>
    apiClient.get<PaginatedResponse<Patient>>('/patients', { params }),

  getById: (id: string) => apiClient.get<ApiResponse<Patient>>(`/patients/${id}`),

  updateProfile: (data: Partial<{
    nik: string
    date_of_birth: string
    gender: string
    address: string
    blood_type: string
    allergies: string
  }>) => apiClient.put<ApiResponse<Patient>>('/patients/profile', data),
}
