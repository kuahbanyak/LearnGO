import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { User } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | Date): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'waiting': return 'secondary'
    case 'in_progress': return 'default'
    case 'completed': return 'outline'
    case 'cancelled': return 'destructive'
    default: return 'secondary'
  }
}

export const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export function getUserRole(user: User | null | undefined): 'admin' | 'doctor' | 'patient' {
  if (!user) return 'patient'
  
  const roleName = user.role?.role_name?.toLowerCase()
  if (roleName === 'admin' || roleName === 'doctor' || roleName === 'patient') {
    return roleName
  }
  
  if (user.doctor) return 'doctor'
  if (user.patient) return 'patient'
  
  return 'patient'
}
