import { useRef, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Calendar,
  Clock,
  CheckCircle,
  Timer,
  Phone,
  ArrowRight,
  Star,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { dashboardApi } from '@/api/dashboard'
import { appointmentApi } from '@/api/appointments'
import { ratingsApi } from '@/api/ratings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/shared/stat-card'
import { PageHeader } from '@/components/shared/page-header'
import StarRating from '@/components/shared/star-rating'
import { useStaggerReveal } from '@/hooks/use-stagger-reveal'
import { useRealtimeSync, type RealtimeMessage } from '@/hooks/use-realtime-sync'
import { queryKeys, queryConfig } from '@/lib/query-keys'
import { useAuthStore } from '@/store/auth-store'
import type { DoctorDashboardStats, Appointment, CheckinEvent } from '@/types'

// ── Helpers ──

function formatTime(timeStr?: string): string {
  if (!timeStr) return '—'
  return timeStr.slice(0, 5)
}

// ── Main Component ──

export default function DoctorDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const statsGridRef = useRef<HTMLDivElement>(null)

  useStaggerReveal(statsGridRef)

  const doctorId = user?.doctor?.id ?? ''

  // ── Data Fetching ──

  const {
    data: statsData,
    isLoading: statsLoading,
  } = useQuery({
    queryKey: queryKeys.dashboard.doctor(),
    queryFn: () => dashboardApi.getDoctorStats(),
    staleTime: queryConfig.dashboard.staleTime,
    gcTime: queryConfig.dashboard.gcTime,
  })

  const {
    data: queueData,
    isLoading: queueLoading,
  } = useQuery({
    queryKey: queryKeys.appointments.todayQueue(),
    queryFn: () => appointmentApi.getTodayQueue(),
    staleTime: queryConfig.dashboard.staleTime,
    gcTime: queryConfig.dashboard.gcTime,
  })

  const {
    data: ratingData,
    isLoading: ratingLoading,
  } = useQuery({
    queryKey: queryKeys.ratings.summary(doctorId),
    queryFn: () => ratingsApi.getDoctorSummary(doctorId),
    staleTime: queryConfig.ratings.staleTime,
    gcTime: queryConfig.ratings.gcTime,
    enabled: !!doctorId,
  })

  // ── Resolve Stats ──

  const rawStats = statsData?.data?.data as Record<string, unknown> | undefined
  const doctorStats: DoctorDashboardStats | undefined = rawStats
    ? {
        total_scheduled: (rawStats.total_scheduled as number) ?? (rawStats.today_queue as number) ?? 0,
        checked_in_waiting: (rawStats.checked_in_waiting as number) ?? (rawStats.waiting_now as number) ?? 0,
        completed_consultations: (rawStats.completed_consultations as number) ?? (rawStats.completed_today as number) ?? 0,
        avg_consultation_duration_minutes: (rawStats.avg_consultation_duration_minutes as number) ?? 0,
      }
    : undefined

  const queue: Appointment[] = queueData?.data?.data ?? []
  const upcomingPatients = queue
    .filter((a) => a.status === 'waiting')
    .slice(0, 3)

  const ratingSummary = ratingData?.data?.data

  // ── Realtime Sync ──

  const handleRealtimeMessage = useCallback(
    (message: RealtimeMessage) => {
      if (message.type === 'checkin') {
        const event = message.data as CheckinEvent
        // Only update if the check-in is for this doctor
        if (!doctorId || event.doctor_id === doctorId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.doctor() })
          queryClient.invalidateQueries({ queryKey: queryKeys.appointments.todayQueue() })
        }
      }
    },
    [queryClient, doctorId]
  )

  const { connectionState } = useRealtimeSync({
    channels: ['checkin'],
    onMessage: handleRealtimeMessage,
    refetchKeys: [[...queryKeys.dashboard.doctor()], [...queryKeys.appointments.todayQueue()]],
  })

  // ── Render ──

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Dashboard Dokter"
        subtitle={`Selamat datang, ${user?.full_name ?? 'Dokter'} — ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
        category="doctor"
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

      {/* 4 StatCards with doctor category color */}
      <div
        ref={statsGridRef}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        role="region"
        aria-label="Metrik dashboard dokter"
      >
        <div className="stagger-item">
          <StatCard
            title="Jadwal Hari Ini"
            value={statsLoading ? '—' : (doctorStats?.total_scheduled ?? 0)}
            icon={Calendar}
            category="doctor"
            animate={true}
          />
        </div>
        <div className="stagger-item">
          <StatCard
            title="Pasien Menunggu"
            value={statsLoading ? '—' : (doctorStats?.checked_in_waiting ?? 0)}
            icon={Clock}
            category="doctor"
            animate={true}
          />
        </div>
        <div className="stagger-item">
          <StatCard
            title="Konsultasi Selesai"
            value={statsLoading ? '—' : (doctorStats?.completed_consultations ?? 0)}
            icon={CheckCircle}
            category="doctor"
            animate={true}
          />
        </div>
        <div className="stagger-item">
          <StatCard
            title="Rata-rata Durasi"
            value={statsLoading ? '—' : `${doctorStats?.avg_consultation_duration_minutes ?? 0} min`}
            icon={Timer}
            category="doctor"
            animate={true}
          />
        </div>
      </div>

      {/* Two-column layout: Upcoming Patients + Rating Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next 3 Upcoming Patients */}
        <Card surface="raised" className="lg:col-span-2" padding="none">
          <CardHeader className="px-6 pt-6 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <div
                  className="p-2 rounded-[var(--radius-md)]"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--category-doctor) 10%, transparent)' }}
                >
                  <Calendar className="size-4" style={{ color: 'var(--category-doctor)' }} />
                </div>
                Pasien Berikutnya
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/doctor/queue">
                  Kelola Antrian <ArrowRight className="size-3 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {queueLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3.5 rounded-[var(--radius-md)]">
                    <div className="w-10 h-10 rounded-full skeleton" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-32 skeleton rounded" />
                      <div className="h-3 w-24 skeleton rounded" />
                    </div>
                    <div className="h-8 w-20 skeleton rounded" />
                  </div>
                ))}
              </div>
            ) : upcomingPatients.length === 0 ? (
              <div className="text-center py-10" style={{ color: 'var(--text-tertiary)' }}>
                <Calendar className="size-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Tidak ada pasien menunggu</p>
                <p className="text-xs mt-1">Pasien akan muncul saat mereka check-in</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingPatients.map((appt) => (
                  <div
                    key={appt.id}
                    className="flex items-center justify-between p-3.5 rounded-[var(--radius-md)] border transition-all"
                    style={{
                      borderColor: 'var(--surface-sunken)',
                      backgroundColor: 'var(--surface-sunken)',
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Queue number badge */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-sm shrink-0"
                        style={{
                          background: 'linear-gradient(135deg, var(--category-doctor), var(--accent-primary))',
                          color: 'var(--text-inverse)',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        {appt.queue_number}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {appt.patient?.user?.full_name ?? appt.patient?.full_name ?? 'Pasien'}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {formatTime(appt.schedule?.start_time)} · Antrian #{appt.queue_number}
                        </p>
                      </div>
                    </div>
                    {/* Quick-call action → navigate to queue page */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate('/doctor/queue')}
                      aria-label={`Panggil ${appt.patient?.user?.full_name ?? 'pasien'}`}
                    >
                      <Phone className="size-3.5 mr-1.5" />
                      Panggil
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rating Summary Panel */}
        <Card surface="raised" padding="none">
          <CardHeader className="px-6 pt-6 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div
                className="p-2 rounded-[var(--radius-md)]"
                style={{ backgroundColor: 'color-mix(in srgb, var(--accent-warning) 10%, transparent)' }}
              >
                <Star className="size-4" style={{ color: 'var(--accent-warning)' }} />
              </div>
              Rating Anda
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {ratingLoading ? (
              <div className="space-y-4">
                <div className="h-8 w-24 skeleton rounded" />
                <div className="h-5 w-32 skeleton rounded" />
                <div className="h-4 w-20 skeleton rounded" />
              </div>
            ) : ratingSummary ? (
              <div className="space-y-4">
                {/* Average rating display */}
                <div className="flex items-baseline gap-3">
                  <span
                    className="text-4xl font-bold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {(ratingSummary.average_score ?? 0).toFixed(1)}
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    / 5.0
                  </span>
                </div>

                {/* Star rating component */}
                <StarRating
                  rating={ratingSummary.average_score ?? 0}
                  size="lg"
                />

                {/* Rating count */}
                <p
                  className="text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Berdasarkan{' '}
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {ratingSummary.total_ratings ?? 0}
                  </span>{' '}
                  penilaian (30 hari terakhir)
                </p>
              </div>
            ) : (
              <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                <Star className="size-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Belum ada penilaian</p>
                <p className="text-xs mt-1">Rating akan muncul setelah pasien memberikan penilaian</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
