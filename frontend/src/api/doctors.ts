import apiClient from './client'
import type { ApiResponse, PaginatedResponse, Doctor, DoctorSchedule } from '@/types'

export const doctorApi = {
  getAll: (params?: { page?: number; per_page?: number }) =>
    apiClient.get<PaginatedResponse<Doctor>>('/doctors', { params }),

  getById: (id: string) => apiClient.get<ApiResponse<Doctor>>(`/doctors/${id}`),

  create: (data: {
    email: string
    password: string
    full_name: string
    phone?: string
    specialization: string
    sip_number: string
  }) => apiClient.post<ApiResponse<Doctor>>('/doctors', data),

  update: (id: string, data: Partial<{ full_name: string; phone: string; specialization: string; sip_number: string }>) =>
    apiClient.put<ApiResponse<Doctor>>(`/doctors/${id}`, data),

  delete: (id: string) => apiClient.delete<ApiResponse<null>>(`/doctors/${id}`),
}

export const scheduleApi = {
  getAll: () => apiClient.get<ApiResponse<DoctorSchedule[]>>('/schedules'),

  getByDoctor: (doctorId: string) =>
    apiClient.get<ApiResponse<DoctorSchedule[]>>(`/schedules/doctor/${doctorId}`),

  create: (data: {
    doctor_id: string
    day_of_week: number
    start_time: string
    end_time: string
    max_patient: number
  }) => apiClient.post<ApiResponse<DoctorSchedule>>('/schedules', data),

  update: (id: string, data: Partial<DoctorSchedule>) =>
    apiClient.put<ApiResponse<DoctorSchedule>>(`/schedules/${id}`, data),

  delete: (id: string) => apiClient.delete<ApiResponse<null>>(`/schedules/${id}`),

  toggle: (id: string) => apiClient.patch<ApiResponse<DoctorSchedule>>(`/schedules/${id}/toggle`),
}
