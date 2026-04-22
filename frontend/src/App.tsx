import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth-store'
import { Toaster } from '@/components/ui/toaster'

// Auth pages
import LoginPage from '@/pages/auth/login'
import RegisterPage from '@/pages/auth/register'

// Layout + Guards
import MainLayout from '@/components/layout/main-layout'
import ProtectedRoute from '@/components/shared/protected-route'

// Admin pages
import AdminDashboard from '@/pages/admin/dashboard'
import AdminDoctorsPage from '@/pages/admin/doctors'
import AdminSchedulesPage from '@/pages/admin/schedules'
import AdminPatientsPage from '@/pages/admin/patients'
import AdminAppointmentsPage from '@/pages/admin/appointments'

// Doctor pages
import DoctorDashboard from '@/pages/doctor/dashboard'
import DoctorQueuePage from '@/pages/doctor/queue'
import DoctorMedicalRecordsPage from '@/pages/doctor/medical-records'

// Patient pages
import PatientDashboard from '@/pages/patient/dashboard'
import BookAppointmentPage from '@/pages/patient/book-appointment'
import MyQueuePage from '@/pages/patient/my-queue'
import MedicalHistoryPage from '@/pages/patient/medical-history'

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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter>
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
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
