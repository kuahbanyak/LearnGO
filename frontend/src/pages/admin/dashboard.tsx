import { useRef, useCallback, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Timer,
  UserCog,
  QrCode,
  BarChart3,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { dashboardApi } from '@/api/dashboard'
import { appointmentApi } from '@/api/appointments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/shared/stat-card'
import { PageHeader } from '@/components/shared/page-header'
import { ErrorState } from '@/components/shared/error-state'
import { useStaggerReveal } from '@/hooks/use-stagger-reveal'
import { useRealtimeSync, type RealtimeMessage } from '@/hooks/use-realtime-sync'
import { queryKeys, queryConfig } from '@/lib/query-keys'
import type {
  AdminDashboardStats,
  Appointment,
  CheckinEvent,
} from '@/types'

// ── Helpers ──

function statusLabel(s: string) {
  if (s === 'waiting') return 'Menunggu'
  if (s === 'in_progress') return 'Ditangani'
  if (s === 'completed') return 'Selesai'
  if (s === 'cancelled') return 'Dibatalkan'
  return s
}

function statusVariant(s: string): 'secondary' | 'default' | 'outline' | 'destructive' | 'success' | 'warning' {
  if (s === 'waiting') return 'warning'
  if (s === 'in_progress') return 'default'
  if (s === 'completed') return 'success'
  if (s === 'cancelled') return 'destructive'
  return 'outline'
}

function getTodayDateString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatTime(timeStr?: string): string {
  if (!timeStr) return '—'
  // Handle HH:MM:SS or HH:MM format
  return timeStr.slice(0, 5)
}

function formatTimestamp(ts: string): string {
  try {
    const date = new Date(ts)
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ts
  }
}

// ── Individual Stat Fetchers (for partial failure isolation) ──

interface StatMetric {
  key: keyof AdminDashboardStats
  title: string
  icon: typeof Calendar
  category: 'admin' | 'doctor' | 'patient' | 'queue' | 'success' | 'warning'
}

const STAT_METRICS: StatMetric[] = [
  { key: 'total_appointments', title: 'Total Janji Temu', icon: Calendar, category: 'admin' },
  { key: 'total_checkins', title: 'Total Check-in', icon: CheckCircle, category: 'queue' },
  { key: 'completed_visits', title: 'Kunjungan Selesai', icon: CheckCircle, category: 'success' },
  { key: 'no_shows', title: 'Tidak Hadir', icon: XCircle, category: 'warning' },
  { key: 'avg_wait_time_minutes', title: 'Rata-rata Tunggu', icon: Timer, category: 'queue' },
  { key: 'active_doctor_count', title: 'Dokter Aktif', icon: UserCog, category: 'doctor' },
]

// ── StatCard with Error Isolation ──

interface IsolatedStatCardProps {
  metric: StatMetric
  value: number | string | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

function IsolatedStatCard({ metric, value, isLoading, isError, onRetry }: IsolatedStatCardProps) {
  if (isError) {
    return (
      <div className="stagger-item">
        <div
          className="rounded-[var(--radius-lg)]"
          style={{
            backgroundColor: 'var(--surface-raised)',
            padding: 'var(--space-6, 1.5rem)',
            boxShadow: 'var(--shadow-sm)',
            minHeight: '7.5rem',
          }}
        >
          <ErrorState
            message="Gagal memuat data"
            category="network"
            onRetry={onRetry}
            retryLabel="Coba Lagi"
            className="!p-0 !gap-2"
          />
        </div>
      </div>
    )
  }

  const displayValue = isLoading
    ? '—'
    : metric.key === 'avg_wait_time_minutes'
      ? `${value ?? 0} min`
      : (value ?? 0)

  return (
    <div className="stagger-item">
      <StatCard
        title={metric.title}
        value={displayValue}
        icon={metric.icon}
        category={metric.category}
        animate={true}
      />
    </div>
  )
}

// ── Recent Check-in Item ──

interface RecentCheckin {
  patient_name: string
  queue_number: number
  timestamp: string
}

// ── Main Component ──

export default function AdminDashboard() {
  const queryClient = useQueryClient()
  const statsGridRef = useRef<HTMLDivElement>(null)
  const today = getTodayDateString()

  useStaggerReveal(statsGridRef)

  // Track recent check-ins from realtime events
  const [recentCheckins, setRecentCheckins] = useState<RecentCheckin[]>([])

  // ── Data Fetching ──

  const {
    data: statsData,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: queryKeys.dashboard.admin(),
    queryFn: () => dashboardApi.getAdminStats(),
    staleTime: queryConfig.dashboard.staleTime,
    gcTime: queryConfig.dashboard.gcTime,
  })

  const {
    data: appointmentsData,
    isLoading: appointmentsLoading,
  } = useQuery({
    queryKey: ['appointments-upcoming-admin', today],
    queryFn: () => appointmentApi.getAll({ page: 1, per_page: 10, date: today }),
    staleTime: queryConfig.appointments.staleTime,
    gcTime: queryConfig.appointments.gcTime,
  })

  // Extract stats — support both nested and flat response shapes
  const stats: AdminDashboardStats | undefined = statsData?.data?.data as unknown as AdminDashboardStats | undefined
  // Fallback: map from DashboardStats if AdminDashboardStats fields are missing
  const rawStats = statsData?.data?.data as Record<string, unknown> | undefined
  const resolvedStats: AdminDashboardStats | undefined = stats?.total_appointments !== undefined
    ? stats
    : rawStats
      ? {
          total_appointments: (rawStats.today_queue as number) ?? 0,
          total_checkins: (rawStats.today_visits as number) ?? 0,
          completed_visits: (rawStats.completed_today as number) ?? 0,
          no_shows: 0,
          avg_wait_time_minutes: 0,
          active_doctor_count: (rawStats.active_doctors as number) ?? 0,
        }
      : undefined

  const upcomingAppointments: Appointment[] = appointmentsData?.data?.data ?? []

  // ── Realtime Sync ──

  const handleRealtimeMessage = useCallback(
    (message: RealtimeMessage) => {
      if (message.type === 'checkin') {
        const event = message.data as CheckinEvent
        // Prepend to recent check-ins list, keep last 30 min worth
        setRecentCheckins((prev) => {
          const updated = [
            { patient_name: event.patient_name, queue_number: event.queue_number, timestamp: event.timestamp },
            ...prev,
          ]
          // Keep only items from last 30 minutes
          const thirtyMinAgo = Date.now() - 30 * 60 * 1000
          return updated.filter((item) => new Date(item.timestamp).getTime() > thirtyMinAgo)
        })
        // Invalidate stats to reflect new check-in count
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.admin() })
      }

      if (message.type === 'appointment_status') {
        // Invalidate appointments list to reflect status change
        queryClient.invalidateQueries({ queryKey: ['appointments-upcoming-admin', today] })
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.admin() })
      }
    },
    [queryClient, today]
  )

  const { connectionState } = useRealtimeSync({
    channels: ['checkin', 'appointment_status'],
    onMessage: handleRealtimeMessage,
    refetchKeys: [[...queryKeys.dashboard.admin()], ['appointments-upcoming-admin', today]],
  })

  // ── Render ──

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Dashboard Admin"
        subtitle={`Ringkasan klinik hari ini — ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
        category="admin"
        actions={
          connectionState === 'connected' ? (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)]"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent-success) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--accent-success) 20%, transparent)',
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: 'var(--accent-success)' }}
              />
              <span className="text-xs font-medium" style={{ color: 'var(--accent-success)' }}>
                Live
              </span>
            </div>
          ) : undefined
        }
      />

      {/* 6 StatCards with stagger reveal and partial failure isolation */}
      <div
        ref={statsGridRef}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
        role="region"
        aria-label="Metrik dashboard"
      >
        {STAT_METRICS.map((metric) => (
          <IsolatedStatCard
            key={metric.key}
            metric={metric}
            value={resolvedStats?.[metric.key]}
            isLoading={statsLoading}
            isError={statsError}
            onRetry={() => refetchStats()}
          />
        ))}
      </div>

      {/* Quick Action Bar */}
      <Card surface="raised" padding="sm">
        <div className="flex flex-wrap items-center gap-3 p-2">
          <span
            className="text-sm font-semibold mr-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            Aksi Cepat:
          </span>
          <Button variant="secondary" size="sm" asChild>
            <Link to="/admin/scan-checkin">
              <QrCode className="size-4" />
              Scan Check-in
            </Link>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link to="/admin/appointments">
              <Calendar className="size-4" />
              Appointments
            </Link>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link to="/admin/analytics">
              <BarChart3 className="size-4" />
              Analytics
            </Link>
          </Button>
        </div>
      </Card>

      {/* Two-column layout: Upcoming Appointments + Recent Check-ins */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments (next 10 today) */}
        <Card surface="raised" className="lg:col-span-2" padding="none">
          <CardHeader className="px-6 pt-6 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <div
                  className="p-2 rounded-[var(--radius-md)]"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--category-admin) 10%, transparent)' }}
                >
                  <Calendar className="size-4" style={{ color: 'var(--category-admin)' }} />
                </div>
                Janji Temu Mendatang
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/appointments">
                  Lihat Semua <ArrowRight className="size-3 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {appointmentsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <div className="w-10 h-10 rounded-full skeleton" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-32 skeleton rounded" />
                      <div className="h-3 w-48 skeleton rounded" />
                    </div>
                    <div className="h-6 w-16 skeleton rounded-full" />
                  </div>
                ))}
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="text-center py-10" style={{ color: 'var(--text-tertiary)' }}>
                <Calendar className="size-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Tidak ada janji temu hari ini</p>
                <p className="text-xs mt-1">Janji temu akan muncul saat pasien mendaftar</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--surface-sunken)]">
                {upcomingAppointments.slice(0, 10).map((appt) => (
                  <div
                    key={appt.id}
                    className="flex items-center justify-between py-3 gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center font-bold text-xs shrink-0"
                        style={{
                          background: 'linear-gradient(135deg, var(--category-queue), var(--accent-primary))',
                          color: 'var(--text-inverse)',
                        }}
                      >
                        {appt.queue_number}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {appt.patient?.user?.full_name ?? appt.patient?.full_name ?? 'Pasien'}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                          {appt.doctor?.user?.full_name ?? appt.doctor?.full_name ?? 'Dokter'} · {formatTime(appt.schedule?.start_time)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusVariant(appt.status)} className="text-[11px] shrink-0">
                      {statusLabel(appt.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Check-ins (last 30 min) */}
        <Card surface="raised" padding="none">
          <CardHeader className="px-6 pt-6 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div
                className="p-2 rounded-[var(--radius-md)]"
                style={{ backgroundColor: 'color-mix(in srgb, var(--category-queue) 10%, transparent)' }}
              >
                <Clock className="size-4" style={{ color: 'var(--category-queue)' }} />
              </div>
              Check-in Terbaru
              {recentCheckins.length > 0 && (
                <span
                  className="ml-1 px-2 py-0.5 text-[11px] rounded-full font-semibold"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--category-queue) 12%, transparent)',
                    color: 'var(--category-queue)',
                  }}
                >
                  {recentCheckins.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {recentCheckins.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                <CheckCircle className="size-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Belum ada check-in</p>
                <p className="text-xs mt-1">Check-in 30 menit terakhir akan muncul di sini</p>
              </div>
            ) : (
              <div
                className="divide-y divide-[var(--surface-sunken)] max-h-[400px] overflow-y-auto"
                role="list"
                aria-label="Daftar check-in terbaru"
                aria-live="polite"
                aria-relevant="additions"
              >
                {recentCheckins.map((checkin, index) => (
                  <div
                    key={`${checkin.queue_number}-${checkin.timestamp}-${index}`}
                    className="flex items-center justify-between py-3 gap-3"
                    role="listitem"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center font-mono font-bold text-xs shrink-0"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--category-queue) 12%, transparent)',
                          color: 'var(--category-queue)',
                        }}
                      >
                        {checkin.queue_number}
                      </div>
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {checkin.patient_name}
                      </p>
                    </div>
                    <span className="text-xs shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                      {formatTimestamp(checkin.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
