import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth-store'

interface ProtectedRouteProps {
  allowedRoles?: ('admin' | 'doctor' | 'patient')[]
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const redirectMap = {
      admin: '/admin/dashboard',
      doctor: '/doctor/dashboard',
      patient: '/patient/dashboard',
    }
    return <Navigate to={redirectMap[user.role]} replace />
  }

  return <Outlet />
}
