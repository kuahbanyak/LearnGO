import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth-store'

// Auth pages
import LoginPage from '@/pages/auth/login'
import RegisterPage from '@/pages/auth/register'

// Layout
import MainLayout from '@/components/layout/main-layout'
import ProtectedRoute from '@/components/shared/protected-route'

// Admin pages
import AdminDashboard from '@/pages/admin/dashboard'
import AdminDoctorsPage from '@/pages/admin/doctors'

// Doctor pages
import DoctorDashboard from '@/pages/doctor/dashboard'
import DoctorQueuePage from '@/pages/doctor/queue'

// Patient pages
import PatientDashboard from '@/pages/patient/dashboard'
import BookAppointmentPage from '@/pages/patient/book-appointment'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60, // 1 min
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
      <BrowserRouter>
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Admin routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<MainLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/doctors" element={<AdminDoctorsPage />} />
              <Route path="/admin/schedules" element={<div className="p-8 text-center text-muted-foreground">Halaman Jadwal — Segera Hadir</div>} />
              <Route path="/admin/patients" element={<div className="p-8 text-center text-muted-foreground">Halaman Pasien — Segera Hadir</div>} />
              <Route path="/admin/appointments" element={<div className="p-8 text-center text-muted-foreground">Halaman Antrian — Segera Hadir</div>} />
            </Route>
          </Route>

          {/* Doctor routes */}
          <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
            <Route element={<MainLayout />}>
              <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
              <Route path="/doctor/queue" element={<DoctorQueuePage />} />
              <Route path="/doctor/medical-records" element={<div className="p-8 text-center text-muted-foreground">Riwayat Rekam Medis — Segera Hadir</div>} />
            </Route>
          </Route>

          {/* Patient routes */}
          <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
            <Route element={<MainLayout />}>
              <Route path="/patient/dashboard" element={<PatientDashboard />} />
              <Route path="/patient/book" element={<BookAppointmentPage />} />
              <Route path="/patient/my-queue" element={<div className="p-8 text-center text-muted-foreground">Antrian Saya — Segera Hadir</div>} />
              <Route path="/patient/medical-history" element={<div className="p-8 text-center text-muted-foreground">Riwayat Medis — Segera Hadir</div>} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
