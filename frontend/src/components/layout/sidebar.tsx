import { useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth-store'
import { cn, getUserRole } from '@/lib/utils'
import {
  LayoutDashboard, Users, UserCog, Calendar, ClipboardList,
  Stethoscope, FileText, LogOut, Heart, ChevronLeft, Menu, X,
  Shield, Tv, BarChart3, Sparkles
} from 'lucide-react'

const adminNavItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Data Pasien', href: '/admin/patients', icon: Users },
  { label: 'Data Dokter', href: '/admin/doctors', icon: UserCog },
  { label: 'Jadwal Praktek', href: '/admin/schedules', icon: Calendar },
  { label: 'Semua Antrian', href: '/admin/appointments', icon: ClipboardList },
  { label: 'Manajemen Pengguna', href: '/admin/users', icon: Shield },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'TV Display', href: '/admin/tv-display', icon: Tv },
]

const doctorNavItems = [
  { label: 'Dashboard', href: '/doctor/dashboard', icon: LayoutDashboard },
  { label: 'Antrian Hari Ini', href: '/doctor/queue', icon: ClipboardList },
  { label: 'Rekam Medis', href: '/doctor/medical-records', icon: FileText },
]

const patientNavItems = [
  { label: 'Dashboard', href: '/patient/dashboard', icon: LayoutDashboard },
  { label: 'Daftar Antrian', href: '/patient/book', icon: Calendar },
  { label: 'Antrian Saya', href: '/patient/my-queue', icon: ClipboardList },
  { label: 'Riwayat Medis', href: '/patient/medical-history', icon: Stethoscope },
  { label: 'Pengaturan', href: '/patient/settings', icon: UserCog },
]

const roleConfig = {
  admin: { label: 'Administrator', gradient: 'from-sky-500 to-blue-600', badge: 'bg-sky-500/15 text-sky-300 border-sky-500/25' },
  doctor: { label: 'Dokter', gradient: 'from-emerald-500 to-teal-600', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' },
  patient: { label: 'Pasien', gradient: 'from-violet-500 to-purple-600', badge: 'bg-violet-500/15 text-violet-300 border-violet-500/25' },
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const role = getUserRole(user)
  const navItems = role === 'admin' ? adminNavItems
    : role === 'doctor' ? doctorNavItems
    : patientNavItems
  const config = roleConfig[role]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  useEffect(() => {
    onMobileClose()
  }, [location.pathname])

  const sidebarContent = (
    <aside className={cn(
      "flex flex-col h-full transition-all duration-300 ease-out",
      collapsed ? "w-[80px]" : "w-[280px]",
      "max-lg:w-[280px]"
    )}
      style={{ background: 'linear-gradient(180deg, hsl(220 30% 12%) 0%, hsl(225 28% 9%) 100%)' }}
    >
      <div className={cn(
        "flex items-center gap-3 px-4 py-5 border-b transition-all duration-300",
        collapsed && "justify-center px-3 lg:px-3"
      )}
        style={{ borderColor: 'hsl(220 20% 20%)' }}
      >
        <div className={cn(
          "flex items-center justify-center rounded-xl bg-linear-to-br shadow-lg transition-all duration-300",
          collapsed ? "w-11 h-11" : "w-11 h-11",
          config.gradient
        )}
        >
          <Heart className="size-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0 max-lg:block flex-1">
            <h1 className="text-lg font-bold text-white tracking-tight">MediQueue</h1>
            <span className={cn("text-[10px] font-medium px-2.5 py-1 rounded-full border", config.badge)}>
              {config.label}
            </span>
          </div>
        )}
        <button
          onClick={onToggle}
          className={cn(
            "p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all hidden lg:flex items-center justify-center",
            collapsed && "mx-auto"
          )}
        >
          <ChevronLeft className={cn("size-4 transition-transform duration-300", collapsed && "rotate-180")} />
        </button>
        <button
          onClick={onMobileClose}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all lg:hidden"
        >
          <X className="size-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {!collapsed && (
          <div className="mb-3 px-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Menu</p>
          </div>
        )}
        <ul className="space-y-1.5">
          {navItems.map(({ label, href, icon: Icon }, index) => (
            <li key={href} style={{ animationDelay: `${index * 40}ms` }} className="stagger-item">
              <NavLink
                to={href}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 relative overflow-hidden",
                    collapsed && "justify-center px-2.5 lg:justify-center lg:px-2.5",
                    isActive
                      ? "text-white shadow-lg"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )
                }
                style={({ isActive }) => isActive
                  ? { background: `linear-gradient(135deg, hsl(200 65% 50%) 0%, hsl(220 55% 55%) 50%, hsl(260 45% 55%) 100%)` }
                  : {}}
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn(
                      "size-[18px] shrink-0 transition-transform duration-200",
                      isActive ? "text-white" : "text-slate-400 group-hover:text-white group-hover:scale-110"
                    )} />
                    {!collapsed && <span className="max-lg:inline">{label}</span>}
                    {isActive && collapsed && (
                      <span className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-full bg-white/70 hidden lg:block" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {!collapsed && (
        <div className="mx-3 mb-3 p-4 rounded-xl border border-white/5" style={{ background: 'hsl(220 25% 16%)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="size-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-slate-300">Status Sistem</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">API Server</span>
            <span className="flex items-center gap-2 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 dot-pulse" />
              Online
            </span>
          </div>
        </div>
      )}

      <div className="px-3 pb-4 border-t pt-4" style={{ borderColor: 'hsl(220 20% 20%)' }}>
        <div className={cn(
          "flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl transition-colors hover:bg-white/5",
          collapsed && "justify-center lg:justify-center px-2"
        )}>
          <div className={cn(
            "shrink-0 rounded-xl bg-linear-to-br flex items-center justify-center text-white text-sm font-bold shadow-lg",
            "w-10 h-10",
            config.gradient
          )}>
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 max-lg:block">
              <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 w-full px-3.5 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all",
            collapsed && "justify-center px-2.5 lg:justify-center lg:px-2.5"
          )}
        >
          <LogOut className="size-4 shrink-0" />
          {!collapsed && <span className="max-lg:inline">Keluar</span>}
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden modal-overlay"
          onClick={onMobileClose}
        />
      )}

      <div className="hidden lg:block fixed inset-y-0 left-0 z-50">
        {sidebarContent}
      </div>

      <div className={cn(
        "lg:hidden fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-out",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {sidebarContent}
      </div>
    </>
  )
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all"
    >
      <Menu className="size-5" />
    </button>
  )
}
