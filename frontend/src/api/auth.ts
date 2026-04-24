import apiClient from './client'
import type { ApiResponse, User } from '@/types'

export const authApi = {
  register: (data: {
    email: string
    password: string
    full_name: string
    phone?: string
    nik?: string
    gender?: string
    address?: string
    blood_type?: string
  }) => apiClient.post<ApiResponse<User>>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<ApiResponse<{ token: string; user: User }>>('/auth/login', data),

  getProfile: () => apiClient.get<ApiResponse<User>>('/auth/me'),

  updateProfile: (data: { 
    full_name?: string
    phone?: string
    nik?: string
    gender?: string
    address?: string
    blood_type?: string
  }) => apiClient.put<ApiResponse<User>>('/auth/profile', data),

  deleteProfile: () => apiClient.delete<ApiResponse<null>>('/auth/me'),
}
