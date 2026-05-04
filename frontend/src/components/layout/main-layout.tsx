import { useState, useEffect, useRef } from 'react'
import { Outlet, useLocation, Link } from 'react-router-dom'
import Sidebar, { MobileMenuButton } from './sidebar'
import { useAuthStore } from '@/store/auth-store'
import { appointmentApi } from '@/api/appointments'
import { toast } from '@/hooks/use-toast'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { Bell, Search, X, ChevronRight } from 'lucide-react'

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
  'settings': 'Pengaturan',
  'users': 'Manajemen Pengguna',
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Pagi'
  if (hour < 15) return 'Siang'
  if (hour < 18) return 'Sore'
  return 'Malam'
}

// Inline time display
function TimeDisplay() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="text-xs font-mono text-slate-400 tabular-nums hidden xl:block">
      {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  )
}

export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const location = useLocation()
  const { user } = useAuthStore()

  // Polling to notify doctor if there's a new patient
  const previousQueueLengthRef = useRef<number | null>(null)
  const { data: queueData } = useQuery({
    queryKey: ['today-queue'],
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

  // Open search input and focus
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchRef.current?.focus(), 50)
    }
  }, [searchOpen])

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

  // Close search on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const roleColor = user?.role === 'admin'
    ? 'from-blue-500 to-indigo-600'
    : user?.role === 'doctor'
    ? 'from-emerald-500 to-teal-600'
    : 'from-cyan-500 to-blue-600'

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
        <header className="sticky top-0 z-30 border-b bg-white/85 backdrop-blur-xl"
          style={{ borderColor: 'hsl(var(--border))' }}>

          {/* Search overlay */}
          {searchOpen && (
            <div className="absolute inset-0 z-10 flex items-center px-4 lg:px-6 bg-white/95 backdrop-blur-xl border-b"
              style={{ borderColor: 'hsl(var(--border))' }}>
              <Search className="size-4 text-slate-400 shrink-0 mr-3" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Cari pasien, dokter, atau jadwal..."
                className="flex-1 text-sm text-slate-800 placeholder:text-slate-400 bg-transparent border-none outline-none"
              />
              <button onClick={() => setSearchOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors ml-2">
                <X className="size-4" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            {/* Left: mobile menu + breadcrumbs */}
            <div className="flex items-center gap-3">
              <MobileMenuButton onClick={() => setMobileOpen(true)} />

              {/* Breadcrumbs — desktop */}
              <nav className="hidden sm:flex items-center gap-1 text-sm" aria-label="Breadcrumb">
                {breadcrumbs.map((crumb, idx) => (
                  <span key={idx} className="flex items-center gap-1">
                    {idx > 0 && <ChevronRight className="size-3.5 text-slate-300" />}
                    <span className={cn(
                      "transition-colors",
                      crumb.isLast
                        ? "text-slate-900 font-semibold"
                        : "text-slate-400 hover:text-slate-600"
                    )}>
                      {crumb.label}
                    </span>
                  </span>
                ))}
              </nav>

              {/* Mobile page title */}
              <h2 className="sm:hidden text-sm font-bold text-slate-900">
                {breadcrumbs[breadcrumbs.length - 1]?.label ?? 'MediQueue'}
              </h2>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-1.5">
              <TimeDisplay />

              {/* Search button */}
              <button
                onClick={() => setSearchOpen(true)}
                id="header-search"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all hidden md:flex items-center gap-2 text-xs font-medium border border-slate-200 hover:border-slate-300 pl-3 pr-2.5"
              >
                <Search className="size-3.5" />
                <span className="hidden lg:inline text-slate-400">Cari...</span>
                <kbd className="hidden lg:inline px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 rounded border border-slate-200 text-slate-400">⌘K</kbd>
              </button>

              {/* Notification bell */}
              <button
                id="header-notifications"
                className="relative p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
              >
                <Bell className="size-[18px]" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>

              {/* User pill — desktop */}
              <div className="hidden md:flex items-center gap-2.5 ml-1 pl-3 border-l"
                style={{ borderColor: 'hsl(var(--border))' }}>
                <div className="text-right hidden lg:block">
                  <p className="text-[13px] font-semibold text-slate-800 leading-tight">
                    Selamat {getGreeting()}! 👋
                  </p>
                  <p className="text-[11px] text-slate-400">{user?.full_name}</p>
                </div>
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${roleColor} flex items-center justify-center text-white text-xs font-bold shadow-md shrink-0`}>
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
        <footer className="px-4 lg:px-8 py-4 border-t"
          style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              © 2026 MediQueue — Sistem Antrian Klinik Pintar
            </p>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs text-slate-400">v1.0.0 · Online</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
