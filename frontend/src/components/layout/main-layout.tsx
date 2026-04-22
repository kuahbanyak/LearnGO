import { useState, useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar, { MobileMenuButton } from './sidebar'
import { useAuthStore } from '@/store/auth-store'
import { appointmentApi } from '@/api/appointments'
import { toast } from '@/hooks/use-toast'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { Bell, Search } from 'lucide-react'

// Map paths to readable breadcrumbs
const pathLabels: Record<string, string> = {
  'admin': 'Admin',
  'doctor': 'Dokter',
  'patient': 'Pasien',
  'dashboard': 'Dashboard',
  'patients': 'Data Pasien',
  'doctors': 'Data Dokter',
  'schedules': 'Jadwal Praktek',
  'appointments': 'Semua Antrian',
  'queue': 'Antrian Hari Ini',
  'medical-records': 'Rekam Medis',
  'book': 'Daftar Antrian',
  'my-queue': 'Antrian Saya',
  'medical-history': 'Riwayat Medis',
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Selamat Pagi'
  if (hour < 15) return 'Selamat Siang'
  if (hour < 18) return 'Selamat Sore'
  return 'Selamat Malam'
}

export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { user } = useAuthStore()

  // Polling to notify doctor if there's a new patient
  const previousQueueLengthRef = useRef<number | null>(null)
  const { data: queueData } = useQuery({
    queryKey: ['today-queue'], // SAME AS DOCTOR DASHBOARD to deduplicate
    queryFn: () => appointmentApi.getTodayQueue(),
    refetchInterval: 10000,
    staleTime: 5000,
    enabled: user?.role === 'doctor',
  })

  useEffect(() => {
    if (user?.role === 'doctor' && queueData?.data?.data) {
      const currentLength = queueData.data.data.length
      if (previousQueueLengthRef.current !== null && currentLength > previousQueueLengthRef.current) {
        toast.info('Pasien Baru', 'Ada pasien baru yang mendaftar antrian hari ini!')
      }
      previousQueueLengthRef.current = currentLength
    }
  }, [queueData, user?.role])

  // Build breadcrumbs from pathname
  const pathSegments = location.pathname.split('/').filter(Boolean)
  const breadcrumbs = pathSegments.map((segment, idx) => ({
    label: pathLabels[segment] ?? segment,
    isLast: idx === pathSegments.length - 1,
  }))

  // Close mobile sidebar on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isDashboard = location.pathname.includes('dashboard')

  return (
    <div className="flex min-h-screen" style={{ background: 'hsl(var(--background))' }}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content area */}
      <div className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300",
        sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[272px]"
      )}>
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur-lg"
          style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            {/* Left side: mobile menu + breadcrumbs */}
            <div className="flex items-center gap-3">
              <MobileMenuButton onClick={() => setMobileOpen(true)} />
              <div className="hidden sm:flex items-center gap-1.5 text-sm">
                {breadcrumbs.map((crumb, idx) => (
                  <span key={idx} className="flex items-center gap-1.5">
                    {idx > 0 && <span className="text-slate-300">/</span>}
                    <span className={cn(
                      crumb.isLast ? "text-slate-900 font-semibold" : "text-slate-400"
                    )}>
                      {crumb.label}
                    </span>
                  </span>
                ))}
              </div>
              {/* Mobile title */}
              <div className="sm:hidden">
                <h2 className="text-sm font-semibold text-slate-900">
                  {breadcrumbs[breadcrumbs.length - 1]?.label ?? 'MediQueue'}
                </h2>
              </div>
            </div>

            {/* Right side: actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors hidden md:flex">
                <Search className="size-[18px]" />
              </button>

              {/* Notifications */}
              <button className="relative p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <Bell className="size-[18px]" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>

              {/* User pill */}
              <div className="hidden md:flex items-center gap-2.5 ml-2 pl-3 border-l"
                style={{ borderColor: 'hsl(var(--border))' }}>
                <div>
                  <p className="text-sm font-medium text-slate-800 text-right leading-tight">
                    {isDashboard ? `${getGreeting()} 👋` : user?.full_name}
                  </p>
                  <p className="text-[11px] text-slate-400 text-right">
                    {isDashboard ? user?.full_name : user?.email}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-500/20">
                  {user?.full_name?.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="px-4 lg:px-8 py-4 border-t text-center"
          style={{ borderColor: 'hsl(var(--border))' }}>
          <p className="text-xs text-slate-400">
            © 2026 MediQueue — Sistem Antrian Klinik Pintar v1.0
          </p>
        </footer>
      </div>
    </div>
  )
}
