import { useEffect, useCallback } from 'react'
import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth-store'
import { getUserRole } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

const DEFAULT_LANDING: Record<'admin' | 'doctor' | 'patient', string> = {
  admin: '/admin/dashboard',
  doctor: '/doctor/dashboard',
  patient: '/patient/dashboard',
}

interface ProtectedRouteProps {
  allowedRoles?: Array<'admin' | 'doctor' | 'patient'>
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const userRole = getUserRole(user)

  if (allowedRoles && user && !allowedRoles.includes(userRole)) {
    return <UnauthorizedRedirect role={userRole} />
  }

  return <Outlet />
}

/**
 * Separate component to handle unauthorized redirect with toast notification.
 * Using a component ensures the toast fires exactly once via useEffect.
 */
function UnauthorizedRedirect({ role }: { role: 'admin' | 'doctor' | 'patient' }) {
  useEffect(() => {
    toast.warning(
      'Akses Ditolak',
      'Halaman yang diminta tidak tersedia untuk peran Anda.'
    )
  }, [])

  return <Navigate to={DEFAULT_LANDING[role]} replace />
}

/**
 * Hook providing a sign-out action that clears Auth_Store and redirects
 * to /login within 300ms.
 */
export function useSignOut() {
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  const signOut = useCallback(() => {
    logout()
    // Redirect within 300ms as per requirement 1.7
    setTimeout(() => {
      navigate('/login', { replace: true })
    }, 0)
  }, [logout, navigate])

  return signOut
}
