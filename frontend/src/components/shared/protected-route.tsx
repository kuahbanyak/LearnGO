import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth-store'
import { getUserRole } from '@/lib/utils'

interface ProtectedRouteProps {
  allowedRoles?: ('admin' | 'doctor' | 'patient')[]
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const userRole = getUserRole(user)
  
  if (allowedRoles && user && !allowedRoles.includes(userRole)) {
    const redirectMap = {
      admin: '/admin/dashboard',
      doctor: '/doctor/dashboard',
      patient: '/patient/dashboard',
    }
    return <Navigate to={redirectMap[userRole]} replace />
  }

  return <Outlet />
}
