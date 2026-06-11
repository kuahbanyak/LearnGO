import client from './client'
import type { User, ApiResponse } from '@/types'

export interface CreateUserPayload {
  username: string
  email: string
  password: string
  full_name: string
  role: string
  is_active: boolean
}

export const userApi = {
  getAll: (params?: { limit?: number; offset?: number }) => {
    return client.get<ApiResponse<{ users: User[], total: number }>>('/users', { params })
  },
  
  getById: (id: string) => {
    return client.get<ApiResponse<User>>(`/users/${id}`)
  },

  create: (data: CreateUserPayload) => {
    return client.post<ApiResponse<User>>('/auth/register', {
      username: data.username,
      email: data.email,
      password: data.password,
      full_name: data.full_name,
      role: data.role,
      is_active: data.is_active,
    })
  },
  
  update: (id: string, data: Partial<User> & Record<string, unknown>) => {
    return client.put<ApiResponse<User>>(`/users/${id}`, data)
  },
  
  delete: (id: string) => {
    return client.delete<ApiResponse<null>>(`/users/${id}`)
  }
}
