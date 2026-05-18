import { useState, useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar, { MobileMenuButton } from './sidebar'
import { useAuthStore } from '@/store/auth-store'
import { useThemeStore } from '@/store/theme-store'
import { appointmentApi } from '@/api/appointments'
import { toast } from '@/hooks/use-toast'
import { useQuery } from '@tanstack/react-query'
import { cn, getUserRole } from '@/lib/utils'
import { Bell, Search, X, ChevronRight, Sun, Moon } from 'lucide-react'

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
function TimeDisplay({ isDark }: { isDark: boolean }) {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <span className={cn("text-xs font-mono tabular-nums hidden xl:block", isDark ? "text-slate-500" : "text-slate-400")}>
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
  const { isDark, toggle: toggleTheme } = useThemeStore()
  const userRole = getUserRole(user)

  // Polling to notify doctor if there's a new patient
  const previousQueueLengthRef = useRef<number | null>(null)
  const { data: queueData } = useQuery({
    queryKey: ['today-queue'],
    queryFn: () => appointmentApi.getTodayQueue(),
    refetchInterval: 10000,
    staleTime: 5000,
    enabled: userRole === 'doctor',
  })

  useEffect(() => {
    if (userRole === 'doctor' && queueData?.data?.data) {
      const currentLength = queueData.data.data.length
      if (previousQueueLengthRef.current !== null && currentLength > previousQueueLengthRef.current) {
        toast.info('Pasien Baru', 'Ada pasien baru yang mendaftar antrian hari ini!')
      }
      previousQueueLengthRef.current = currentLength
    }
  }, [queueData, userRole])

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

  const roleColor = userRole === 'admin'
    ? 'from-blue-500 to-indigo-600'
    : userRole === 'doctor'
    ? 'from-emerald-500 to-teal-600'
    : 'from-cyan-500 to-blue-600'

  return (
    <div className={cn("flex min-h-screen transition-colors duration-300", isDark && "dark")} style={{ background: 'hsl(var(--background))' }}>
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
        <header className={cn("sticky top-0 z-30 border-b backdrop-blur-xl transition-colors duration-300", isDark ? "bg-slate-900/85" : "bg-white/85")}
          style={{ borderColor: 'hsl(var(--border))' }}>

          {/* Search overlay */}
          {searchOpen && (
            <div className={cn("absolute inset-0 z-10 flex items-center px-4 lg:px-6 backdrop-blur-xl border-b", isDark ? "bg-slate-900/95" : "bg-white/95")}
              style={{ borderColor: 'hsl(var(--border))' }}>
              <Search className={cn("size-4 shrink-0 mr-3", isDark ? "text-slate-500" : "text-slate-400")} />
              <input
                ref={searchRef}
                type="text"
                placeholder="Cari pasien, dokter, atau jadwal..."
                className={cn("flex-1 text-sm placeholder:text-slate-400 bg-transparent border-none outline-none", isDark ? "text-white" : "text-slate-800")}
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
                        ? isDark ? "text-white font-semibold" : "text-slate-900 font-semibold"
                        : isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"
                    )}>
                      {crumb.label}
                    </span>
                  </span>
                ))}
              </nav>

              {/* Mobile page title */}
              <h2 className={cn("sm:hidden text-sm font-bold", isDark ? "text-white" : "text-slate-900")}>
                {breadcrumbs[breadcrumbs.length - 1]?.label ?? 'MediQueue'}
              </h2>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-1.5">
              <TimeDisplay isDark={isDark} />

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                id="header-theme-toggle"
                className={cn(
                  "p-2 rounded-xl transition-all relative overflow-hidden group",
                  isDark
                    ? "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                    : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                )}
                title={isDark ? 'Mode Terang' : 'Mode Gelap'}
              >
                <div className="relative w-[18px] h-[18px]">
                  <Sun className={cn("size-[18px] absolute inset-0 transition-all duration-300", isDark ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0")} />
                  <Moon className={cn("size-[18px] absolute inset-0 transition-all duration-300", isDark ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100")} />
                </div>
              </button>

              {/* Search button */}
              <button
                onClick={() => setSearchOpen(true)}
                id="header-search"
                className={cn(
                  "p-2 rounded-xl transition-all hidden md:flex items-center gap-2 text-xs font-medium pl-3 pr-2.5",
                  isDark
                    ? "text-slate-400 hover:text-white hover:bg-white/10 border border-slate-700 hover:border-slate-600"
                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 hover:border-slate-300"
                )}
              >
                <Search className="size-3.5" />
                <span className={cn("hidden lg:inline", isDark ? "text-slate-500" : "text-slate-400")}>Cari...</span>
                <kbd className={cn("hidden lg:inline px-1.5 py-0.5 text-[10px] font-mono rounded border", isDark ? "bg-slate-800 border-slate-700 text-slate-500" : "bg-slate-100 border-slate-200 text-slate-400")}>⌘K</kbd>
              </button>

              {/* Notification bell */}
              <button
                id="header-notifications"
                className={cn(
                  "relative p-2 rounded-xl transition-all",
                  isDark ? "text-slate-400 hover:text-white hover:bg-white/10" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                )}
              >
                <Bell className="size-[18px]" />
                <span className={cn("absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2", isDark ? "ring-slate-900" : "ring-white")} />
              </button>

              {/* User pill — desktop */}
              <div className="hidden md:flex items-center gap-2.5 ml-1 pl-3 border-l"
                style={{ borderColor: 'hsl(var(--border))' }}>
                <div className="text-right hidden lg:block">
                  <p className={cn("text-[13px] font-semibold leading-tight", isDark ? "text-white" : "text-slate-800")}>
                    Selamat {getGreeting()}! 👋
                  </p>
                  <p className={cn("text-[11px]", isDark ? "text-slate-500" : "text-slate-400")}>{user?.full_name}</p>
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
        <footer className={cn("px-4 lg:px-8 py-4 border-t transition-colors duration-300", isDark && "bg-slate-900/50")}
          style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="flex items-center justify-between">
            <p className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-400")}>
              © 2026 MediQueue — Sistem Antrian Klinik Pintar
            </p>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-400")}>v1.0.0 · Online</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
