import { useEffect, useRef } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth-store'
import { cn, getUserRole } from '@/lib/utils'
import { t } from '@/lib/i18n'
import {
  LayoutDashboard, Users, UserCog, Calendar, ClipboardList,
  Stethoscope, FileText, LogOut, Heart, ChevronLeft, Menu, X,
  Shield, BarChart3, QrCode, Sparkles,
  type LucideIcon,
} from 'lucide-react'

/**
 * Navigation item definition for role-aware sidebar.
 * Requirement 1.2, 1.3, 1.4: Role-specific navigation entries.
 */
export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
  badge?: number
}

/**
 * Returns navigation items based on the user's role.
 * Exported for use in tests and other components.
 *
 * Requirement 1.2: Admin navigation entries
 * Requirement 1.3: Doctor navigation entries
 * Requirement 1.4: Patient navigation entries
 */
export function getNavItems(role: 'admin' | 'doctor' | 'patient'): NavItem[] {
  switch (role) {
    case 'admin':
      return [
        { label: t('nav.dashboard'), path: '/admin/dashboard', icon: LayoutDashboard },
        { label: t('nav.doctors'), path: '/admin/doctors', icon: UserCog },
        { label: t('nav.schedules'), path: '/admin/schedules', icon: Calendar },
        { label: t('nav.patients'), path: '/admin/patients', icon: Users },
        { label: t('nav.appointments'), path: '/admin/appointments', icon: ClipboardList },
        { label: t('nav.users'), path: '/admin/users', icon: Shield },
        { label: t('nav.analytics'), path: '/admin/analytics', icon: BarChart3 },
        { label: t('nav.scanCheckin'), path: '/admin/scan-checkin', icon: QrCode },
      ]
    case 'doctor':
      return [
        { label: t('nav.dashboard'), path: '/doctor/dashboard', icon: LayoutDashboard },
        { label: t('nav.queue'), path: '/doctor/queue', icon: ClipboardList },
        { label: t('nav.medicalRecords'), path: '/doctor/medical-records', icon: FileText },
      ]
    case 'patient':
      return [
        { label: t('nav.dashboard'), path: '/patient/dashboard', icon: LayoutDashboard },
        { label: t('nav.bookAppointment'), path: '/patient/book', icon: Calendar },
        { label: t('nav.myQueue'), path: '/patient/my-queue', icon: ClipboardList },
        { label: t('nav.medicalHistory'), path: '/patient/medical-history', icon: Stethoscope },
        { label: t('nav.settings'), path: '/patient/settings', icon: UserCog },
      ]
  }
}

/**
 * Returns the CSS custom property name for the role's category color.
 * Requirement 1.5: Active state uses role category color token.
 */
function getCategoryColorVar(role: 'admin' | 'doctor' | 'patient'): string {
  switch (role) {
    case 'admin': return 'var(--category-admin)'
    case 'doctor': return 'var(--category-doctor)'
    case 'patient': return 'var(--category-patient)'
  }
}

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
  /** Callback fired when the sidebar nav area is scrolled */
  onScroll?: (scrollTop: number) => void
  /** Initial scroll position to restore on mount/route change */
  initialScrollTop?: number
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose, onScroll, initialScrollTop }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const navScrollRef = useRef<HTMLElement>(null)

  const role = getUserRole(user)
  const navItems = getNavItems(role)
  const config = roleConfig[role]
  const categoryColor = getCategoryColorVar(role)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Close mobile sidebar on route change
  useEffect(() => {
    onMobileClose()
  }, [location.pathname])

  // Restore sidebar scroll position on mount and route changes
  useEffect(() => {
    if (navScrollRef.current && initialScrollTop !== undefined) {
      navScrollRef.current.scrollTop = initialScrollTop
    }
  }, [location.pathname, initialScrollTop])

  // Report scroll position changes to parent
  const handleNavScroll = () => {
    if (navScrollRef.current && onScroll) {
      onScroll(navScrollRef.current.scrollTop)
    }
  }

  const sidebarContent = (
    <aside
      className={cn(
        "flex flex-col h-full transition-all duration-300 ease-out",
        collapsed ? "w-[80px]" : "w-[280px]",
        "max-md:w-[280px]"
      )}
      style={{ background: 'linear-gradient(180deg, hsl(220 30% 12%) 0%, hsl(225 28% 9%) 100%)' }}
    >
      {/* Header / Brand */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-5 border-b transition-all duration-300",
          collapsed && "justify-center px-3 md:px-3"
        )}
        style={{ borderColor: 'hsl(220 20% 20%)' }}
      >
        <div
          className={cn(
            "flex items-center justify-center rounded-xl bg-linear-to-br shadow-lg transition-all duration-300",
            "w-11 h-11",
            config.gradient
          )}
        >
          <Heart className="size-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0 max-md:block flex-1">
            <h1 className="text-lg font-bold text-white tracking-tight">MediQueue</h1>
            <span className={cn("text-[10px] font-medium px-2.5 py-1 rounded-full border", config.badge)}>
              {config.label}
            </span>
          </div>
        )}
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            "p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all hidden md:flex items-center justify-center",
            collapsed && "mx-auto"
          )}
        >
          <ChevronLeft className={cn("size-4 transition-transform duration-300", collapsed && "rotate-180")} />
        </button>
        <button
          onClick={onMobileClose}
          aria-label="Close navigation menu"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all md:hidden"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Navigation - Requirement 23.1: aria-label on nav element */}
      <nav
        ref={navScrollRef}
        className="flex-1 overflow-y-auto py-4 px-3"
        aria-label="Main navigation"
        onScroll={handleNavScroll}
      >
        {!collapsed && (
          <div className="mb-3 px-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Menu</p>
          </div>
        )}
        <ul className="space-y-1.5">
          {navItems.map(({ label, path, icon: Icon }, index) => (
            <li key={path} style={{ animationDelay: `${index * 40}ms` }} className="stagger-item">
              <NavLink
                to={path}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 relative overflow-hidden",
                    collapsed && "justify-center px-2.5 md:justify-center md:px-2.5",
                    isActive
                      ? "text-white shadow-lg"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )
                }
                style={({ isActive }) => isActive
                  ? { backgroundColor: categoryColor, opacity: 0.95 }
                  : {}
                }
                // Requirement 1.5: aria-current="page" on active item
                aria-current={location.pathname === path ? 'page' : undefined}
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn(
                      "size-[18px] shrink-0 transition-transform duration-200",
                      isActive ? "text-white" : "text-slate-400 group-hover:text-white group-hover:scale-110"
                    )} />
                    {!collapsed && <span className="max-md:inline">{label}</span>}
                    {isActive && collapsed && (
                      <span className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-full bg-white/70 hidden md:block" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* System status panel */}
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

      {/* User section + logout */}
      <div className="px-3 pb-4 border-t pt-4" style={{ borderColor: 'hsl(220 20% 20%)' }}>
        <div className={cn(
          "flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl transition-colors hover:bg-white/5",
          collapsed && "justify-center md:justify-center px-2"
        )}>
          <div className={cn(
            "shrink-0 rounded-xl bg-linear-to-br flex items-center justify-center text-white text-sm font-bold shadow-lg",
            "w-10 h-10",
            config.gradient
          )}>
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 max-md:block">
              <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          aria-label={t('actions.signOut')}
          className={cn(
            "flex items-center gap-3 w-full px-3.5 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all",
            collapsed && "justify-center px-2.5 md:justify-center md:px-2.5"
          )}
        >
          <LogOut className="size-4 shrink-0" />
          {!collapsed && <span className="max-md:inline">{t('actions.signOut')}</span>}
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden modal-overlay"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Desktop/tablet sidebar — visible at ≥768px (icon-only at 768-1023, full at ≥1024) */}
      <div className="hidden md:block fixed inset-y-0 left-0 z-50">
        {sidebarContent}
      </div>

      {/* Mobile sidebar (slide-over drawer) — only used at <768px */}
      <div className={cn(
        "md:hidden fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-out",
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
      aria-label="Open navigation menu"
      className="md:hidden p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all"
    >
      <Menu className="size-5" />
    </button>
  )
}
