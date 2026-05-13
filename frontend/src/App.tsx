import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth-store'
import { Toaster } from '@/components/ui/toaster'
import { ErrorBoundary } from '@/components/shared/error-boundary'
import { lazy, Suspense } from 'react'

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
const TvDisplayPage = lazy(() => import('@/pages/admin/tv-display'))
const AnalyticsPage = lazy(() => import('@/pages/admin/analytics'))
const CheckInPage = lazy(() => import('@/pages/public/check-in'))

// Lazy load doctor pages
const DoctorDashboard = lazy(() => import('@/pages/doctor/dashboard'))
const DoctorQueuePage = lazy(() => import('@/pages/doctor/queue'))
const DoctorMedicalRecordsPage = lazy(() => import('@/pages/doctor/medical-records'))

// Lazy load patient pages
const PatientDashboard = lazy(() => import('@/pages/patient/dashboard'))
const BookAppointmentPage = lazy(() => import('@/pages/patient/book-appointment'))
const MyQueuePage = lazy(() => import('@/pages/patient/my-queue'))
const MedicalHistoryPage = lazy(() => import('@/pages/patient/medical-history'))
const PatientSettingsPage = lazy(() => import('@/pages/patient/settings'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60,
    },
  },
})

function RootRedirect() {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  const redirectMap = {
    admin: '/admin/dashboard',
    doctor: '/doctor/dashboard',
    patient: '/patient/dashboard',
  }
  return <Navigate to={redirectMap[user?.role ?? 'patient']} replace />
}

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-slate-600 dark:text-slate-400">Loading...</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<RootRedirect />} />

              {/* Public */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Admin */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route element={<MainLayout />}>
                  <Route path="/admin/dashboard"    element={<AdminDashboard />} />
                  <Route path="/admin/doctors"      element={<AdminDoctorsPage />} />
                  <Route path="/admin/schedules"    element={<AdminSchedulesPage />} />
                  <Route path="/admin/patients"     element={<AdminPatientsPage />} />
                  <Route path="/admin/appointments" element={<AdminAppointmentsPage />} />
                  <Route path="/admin/users"        element={<AdminUsersPage />} />
                  <Route path="/admin/analytics"    element={<AnalyticsPage />} />
                </Route>
                {/* Standalone Pages without Layout */}
                <Route path="/admin/tv-display"   element={<TvDisplayPage />} />
                <Route path="/check-in"          element={<CheckInPage />} />
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
