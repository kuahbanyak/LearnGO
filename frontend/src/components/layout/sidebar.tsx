import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth-store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, UserCog, Calendar, ClipboardList,
  Stethoscope, FileText, LogOut, Heart, ChevronLeft, Menu, X,
  Activity, Shield
} from 'lucide-react'

const adminNavItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Data Pasien', href: '/admin/patients', icon: Users },
  { label: 'Data Dokter', href: '/admin/doctors', icon: UserCog },
  { label: 'Jadwal Praktek', href: '/admin/schedules', icon: Calendar },
  { label: 'Semua Antrian', href: '/admin/appointments', icon: ClipboardList },
  { label: 'Manajemen Pengguna', href: '/admin/users', icon: Shield },
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
  admin: { label: 'Administrator', color: 'from-blue-500 to-indigo-600', badge: 'bg-blue-500/20 text-blue-300' },
  doctor: { label: 'Dokter', color: 'from-emerald-500 to-teal-600', badge: 'bg-emerald-500/20 text-emerald-300' },
  patient: { label: 'Pasien', color: 'from-cyan-500 to-blue-600', badge: 'bg-cyan-500/20 text-cyan-300' },
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

  const role = user?.role ?? 'patient'
  const navItems = role === 'admin' ? adminNavItems
    : role === 'doctor' ? doctorNavItems
    : patientNavItems
  const config = roleConfig[role]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Close mobile sidebar on route change
  useEffect(() => {
    onMobileClose()
  }, [location.pathname])

  const sidebarContent = (
    <aside className={cn(
      "flex flex-col h-full transition-all duration-300 ease-in-out",
      collapsed ? "w-[72px]" : "w-[272px]",
      "max-lg:w-[272px]"
    )}
      style={{ background: 'linear-gradient(180deg, hsl(220 27% 14%) 0%, hsl(225 30% 10%) 100%)' }}
    >
      {/* Logo Area */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-5 border-b transition-all duration-300",
        collapsed && "justify-center px-2 lg:px-2"
      )}
        style={{ borderColor: 'hsl(220 27% 22%)' }}
      >
        <div className={cn(
          "flex items-center justify-center rounded-xl bg-gradient-to-br shadow-lg shadow-blue-500/20 transition-all duration-300",
          collapsed ? "w-10 h-10" : "w-10 h-10",
          config.color
        )}>
          <Heart className="size-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0 max-lg:block">
            <h1 className="text-lg font-bold text-white tracking-tight">MediQueue</h1>
            <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", config.badge)}>
              {config.label}
            </span>
          </div>
        )}
        {/* Collapse button - desktop only */}
        <button
          onClick={onToggle}
          className={cn(
            "ml-auto p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all hidden lg:flex items-center justify-center",
            collapsed && "ml-0"
          )}
        >
          <ChevronLeft className={cn("size-4 transition-transform duration-300", collapsed && "rotate-180")} />
        </button>
        {/* Close button - mobile only */}
        <button
          onClick={onMobileClose}
          className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all lg:hidden"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className={cn("mb-3 px-3", collapsed && "hidden max-lg:block")}>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Menu</p>
        </div>
        <ul className="space-y-1">
          {navItems.map(({ label, href, icon: Icon }, index) => (
            <li key={href} style={{ animationDelay: `${index * 50}ms` }} className="stagger-item">
              <NavLink
                to={href}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden",
                    collapsed && "justify-center px-2 lg:justify-center lg:px-2",
                    isActive
                      ? "text-white shadow-md"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )
                }
                style={({ isActive }) => isActive
                  ? { background: `linear-gradient(135deg, hsl(199 89% 48%) 0%, hsl(217 89% 61%) 100%)` }
                  : {}}
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn(
                      "size-[18px] shrink-0 transition-transform duration-200",
                      isActive ? "text-white" : "text-slate-400 group-hover:text-white group-hover:scale-110"
                    )} />
                    {!collapsed && (
                      <span className="max-lg:inline">{label}</span>
                    )}
                    {/* Active indicator dot */}
                    {isActive && collapsed && (
                      <span className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-l-full bg-white/60 hidden lg:block" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* System Status */}
      {!collapsed && (
        <div className="mx-3 mb-3 p-3 rounded-xl max-lg:block"
          style={{ background: 'hsl(220 27% 18%)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="size-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-slate-300">Status Sistem</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">API Server</span>
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 dot-pulse" />
              Online
            </span>
          </div>
        </div>
      )}

      {/* User & Logout */}
      <div className="px-3 pb-4 border-t pt-4"
        style={{ borderColor: 'hsl(220 27% 22%)' }}>
        <div className={cn(
          "flex items-center gap-3 px-2 py-2 mb-2 rounded-xl transition-colors hover:bg-white/5",
          collapsed && "justify-center lg:justify-center"
        )}>
          <div className={cn(
            "shrink-0 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold shadow-lg",
            collapsed ? "w-9 h-9" : "w-9 h-9",
            config.color
          )}>
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 max-lg:block">
              <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all",
            collapsed && "justify-center px-2 lg:justify-center lg:px-2"
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
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden modal-overlay"
          onClick={onMobileClose}
        />
      )}

      {/* Desktop sidebar - always visible */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-50">
        {sidebarContent}
      </div>

      {/* Mobile sidebar - slide in */}
      <div className={cn(
        "lg:hidden fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {sidebarContent}
      </div>
    </>
  )
}

/* Mobile menu trigger - used by MainLayout */
export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
    >
      <Menu className="size-5" />
    </button>
  )
}
