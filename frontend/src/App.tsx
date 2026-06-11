import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth-store'
import { queryClient } from '@/lib/query-client'
import { Toaster } from '@/components/ui/toaster'
import { ErrorBoundary } from '@/components/shared/error-boundary'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { lazy, Suspense, useEffect } from 'react'
import { getUserRole } from '@/lib/utils'
import { useThemeStore } from '@/store/theme-store'
import { initializeTheme, resolveTheme } from '@/store/theme-resolver'

// Eager load critical components
import LoginPage from '@/pages/auth/login'
import RegisterPage from '@/pages/auth/register'
import MainLayout from '@/components/layout/main-layout'
import ProtectedRoute from '@/components/shared/protected-route'

// Lazy load admin pages
const AdminDashboard = lazy(() => import('@/pages/admin/dashboard'))
const AdminDoctorsPage = lazy(() => import('@/pages/admin/doctors'))
const AdminSchedulesPage = lazy(() => import('@/pages/admin/schedules'))
const AdminPatientsPage = lazy(() => import('@/pages/admin/patients'))
const AdminAppointmentsPage = lazy(() => import('@/pages/admin/appointments'))
const AdminUsersPage = lazy(() => import('@/pages/admin/users'))
const ScanCheckInPage = lazy(() => import('@/pages/admin/scan-checkin'))

// Lazy load heavy pages (Requirement 24.4)
const AdminAnalyticsPage = lazy(() => import('@/pages/admin/analytics'))
const DoctorMedicalRecordsPage = lazy(() => import('@/pages/doctor/medical-records'))
const TVDisplayPage = lazy(() => import('@/pages/admin/tv-display'))

// Lazy load public pages
const CheckInPage = lazy(() => import('@/pages/public/check-in'))

// Lazy load doctor pages
const DoctorDashboard = lazy(() => import('@/pages/doctor/dashboard'))
const DoctorQueuePage = lazy(() => import('@/pages/doctor/queue'))

// Lazy load patient pages
const PatientDashboard = lazy(() => import('@/pages/patient/dashboard'))
const BookAppointmentPage = lazy(() => import('@/pages/patient/book-appointment'))
const MyQueuePage = lazy(() => import('@/pages/patient/my-queue'))
const MedicalHistoryPage = lazy(() => import('@/pages/patient/medical-history'))
const PatientSettingsPage = lazy(() => import('@/pages/patient/settings'))

function RootRedirect() {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  const role = getUserRole(user)
  const redirectMap = {
    admin: '/admin/dashboard',
    doctor: '/doctor/dashboard',
    patient: '/patient/dashboard',
  }
  return <Navigate to={redirectMap[role]} replace />
}

// Loading fallback for lazy-loaded route components (Requirement 24.4)
function LazyLoadFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-4">
        <LoadingSkeleton variant="stat-card" count={2} />
        <LoadingSkeleton variant="table-row" count={3} />
      </div>
    </div>
  )
}

/**
 * Initializes the theme on first mount and re-applies it whenever the
 * ThemeStore config changes (e.g. after Zustand rehydration or an external
 * config update). This ensures:
 *  - Req 2.5: persisted theme is restored on load
 *  - Req 2.7: OS preference is detected when no persisted preference exists
 *  - Req 10.2: --font-scale is applied on load
 *  - Req 10.6: font scale is restored from persistence on load
 *  - Req 2.2: data-theme attribute is set before first paint
 */
function ThemeInitializer() {
  const config = useThemeStore((state) => state.config)

  // On first mount: apply persisted theme or detect OS preference (Req 2.5, 2.7)
  useEffect(() => {
    initializeTheme(config)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally run once on mount

  // On every config change: re-apply theme as a safety net for SSR hydration
  // or external config changes (Req 2.2, 10.2)
  useEffect(() => {
    resolveTheme(config)
  }, [config])

  return null
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeInitializer />
        <Toaster />
        <BrowserRouter>
          <Suspense fallback={<LazyLoadFallback />}>
            <Routes>
              <Route path="/" element={<RootRedirect />} />

              {/* Public */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/check-in" element={<CheckInPage />} />
              <Route path="/admin/tv-display" element={<TVDisplayPage />} />

              {/* Admin */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route element={<MainLayout />}>
                  <Route path="/admin/dashboard"    element={<AdminDashboard />} />
                  <Route path="/admin/doctors"      element={<AdminDoctorsPage />} />
                  <Route path="/admin/schedules"    element={<AdminSchedulesPage />} />
                  <Route path="/admin/patients"     element={<AdminPatientsPage />} />
                  <Route path="/admin/appointments" element={<AdminAppointmentsPage />} />
                  <Route path="/admin/users"        element={<AdminUsersPage />} />
                  <Route path="/admin/analytics"    element={<AdminAnalyticsPage />} />
                  <Route path="/admin/scan-checkin" element={<ScanCheckInPage />} />
                </Route>
              </Route>

              {/* Doctor */}
              <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
                <Route element={<MainLayout />}>
                  <Route path="/doctor/dashboard"      element={<DoctorDashboard />} />
                  <Route path="/doctor/queue"          element={<DoctorQueuePage />} />
                  <Route path="/doctor/medical-records" element={<DoctorMedicalRecordsPage />} />
                </Route>
              </Route>

              {/* Patient */}
              <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
                <Route element={<MainLayout />}>
                  <Route path="/patient/dashboard"       element={<PatientDashboard />} />
                  <Route path="/patient/book"            element={<BookAppointmentPage />} />
                  <Route path="/patient/my-queue"        element={<MyQueuePage />} />
                  <Route path="/patient/medical-history" element={<MedicalHistoryPage />} />
                  <Route path="/patient/settings"        element={<PatientSettingsPage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
