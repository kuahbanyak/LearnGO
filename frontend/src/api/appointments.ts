import apiClient from './client'
import type { ApiResponse, PaginatedResponse, Appointment, MedicalRecord } from '@/types'

export const appointmentApi = {
  getAll: (params?: { page?: number; per_page?: number; status?: string; date?: string }) =>
    apiClient.get<PaginatedResponse<Appointment>>('/appointments', { params }),

  getMy: (params?: { page?: number; per_page?: number }) =>
    apiClient.get<PaginatedResponse<Appointment>>('/appointments/my', { params }),

  getTodayQueue: (date?: string) =>
    apiClient.get<ApiResponse<Appointment[]>>('/appointments/today', { params: { date } }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Appointment>>(`/appointments/${id}`),

  book: (data: { doctor_id: string; schedule_id: string; appointment_date: string }) =>
    apiClient.post<ApiResponse<Appointment>>('/appointments', data),

  updateStatus: (id: string, status: string) =>
    apiClient.patch<ApiResponse<Appointment>>(`/appointments/${id}/status`, { status }),

  cancel: (id: string, reason?: string) =>
    apiClient.patch<ApiResponse<null>>(`/appointments/${id}/cancel`, { reason }),
}

export const medicalRecordApi = {
  create: (data: {
    appointment_id: string
    complaint: string
    diagnosis?: string
    icd_code?: string
    action_taken?: string
    doctor_notes?: string
    prescriptions?: {
      medicine_name: string
      dosage?: string
      quantity?: number
      usage_instruction?: string
      notes?: string
    }[]
  }) => apiClient.post<ApiResponse<MedicalRecord>>('/medical-records', data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<MedicalRecord>>(`/medical-records/${id}`),

  // Doctor: lihat rekam medis pasien berdasarkan patient UUID
  getByPatient: (patientId: string, params?: { page?: number }) =>
    apiClient.get<PaginatedResponse<MedicalRecord>>(`/medical-records/patient/${patientId}`, { params }),

  // Patient: lihat rekam medis sendiri (endpoint khusus, otentikasi via JWT)
  getMy: (params?: { page?: number }) =>
    apiClient.get<PaginatedResponse<MedicalRecord>>('/medical-records/my', { params }),
}
