import client from './client'
import type { User, ApiResponse, PaginatedResponse } from '@/types'

export const userApi = {
  getAll: (params?: { limit?: number; offset?: number }) => {
    return client.get<ApiResponse<{ users: User[], total: number }>>('/users', { params })
  },
  
  getById: (id: string) => {
    return client.get<ApiResponse<User>>(`/users/${id}`)
  },
  
  update: (id: string, data: Partial<User>) => {
    return client.put<ApiResponse<User>>(`/users/${id}`, data)
  },
  
  delete: (id: string) => {
    return client.delete<ApiResponse<null>>(`/users/${id}`)
  }
}
