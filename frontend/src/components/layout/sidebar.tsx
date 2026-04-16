import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth-store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, UserCog, Calendar, ClipboardList,
  Stethoscope, FileText, LogOut, Heart
} from 'lucide-react'

const adminNavItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Data Pasien', href: '/admin/patients', icon: Users },
  { label: 'Data Dokter', href: '/admin/doctors', icon: UserCog },
  { label: 'Jadwal Praktek', href: '/admin/schedules', icon: Calendar },
  { label: 'Semua Antrian', href: '/admin/appointments', icon: ClipboardList },
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
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const role = user?.role
  const navItems = role === 'admin' ? adminNavItems
    : role === 'doctor' ? doctorNavItems
    : patientNavItems

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col"
      style={{ background: 'hsl(var(--sidebar-background))' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b"
        style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
        <div className="flex items-center justify-center w-9 h-9 rounded-lg gradient-primary">
          <Heart className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">MediQueue</h1>
          <p className="text-xs capitalize" style={{ color: 'hsl(var(--sidebar-foreground) / 0.6)' }}>
            {role}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map(({ label, href, icon: Icon }) => (
            <li key={href}>
              <NavLink
                to={href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "text-slate-300 hover:bg-sidebar-accent hover:text-white"
                  )
                }
                style={({ isActive }) => isActive
                  ? { background: 'hsl(var(--sidebar-primary))' }
                  : {}}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User + Logout */}
      <div className="px-3 pb-4 border-t pt-4"
        style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition-all"
        >
          <LogOut className="size-4" />
          Keluar
        </button>
      </div>
    </aside>
  )
}
