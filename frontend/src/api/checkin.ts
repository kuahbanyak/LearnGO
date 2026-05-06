import apiClient from './client'
import type { ApiResponse } from '@/types'

export interface CheckInStatus {
  checked_in: boolean
  checked_at?: string
  message?: string
}

export const checkInApi = {
  // Get QR code image for appointment
  getQRCode: (appointmentId: string) =>
    apiClient.get<Blob>(`/appointments/${appointmentId}/qr`, {
      responseType: 'blob',
    }),

  // Check in via token (public endpoint)
  checkIn: (token: string) =>
    apiClient.patch<ApiResponse<{
      appointment_id: string
      queue_number: number
      doctor: string
      status: string
    }>>(`/check-in/${token}`),

  // Get check-in status for appointment
  getStatus: (appointmentId: string) =>
    apiClient.get<ApiResponse<CheckInStatus>>(`/appointments/${appointmentId}/check-in-status`),
}
