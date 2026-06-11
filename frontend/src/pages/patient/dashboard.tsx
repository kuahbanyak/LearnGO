import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Calendar,
  Clock,
  CheckCircle,
  FileText,
  Stethoscope,
  ArrowRight,
  Eye,
  CalendarPlus,
  ListOrdered,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { dashboardApi } from '@/api/dashboard'
import { appointmentApi, medicalRecordApi } from '@/api/appointments'
import { useAuthStore } from '@/store/auth-store'
import { useStaggerReveal } from '@/hooks/use-stagger-reveal'
import { queryKeys, STALE_TIME_DASHBOARD, GC_TIME_DASHBOARD, STALE_TIME_RECORDS, GC_TIME_RECORDS } from '@/lib/query-keys'
import { formatDate } from '@/lib/utils'

import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import type { PatientDashboardData, MedicalRecord } from '@/types'

/**
 * PatientDashboard — Landing page for Patient role.
 *
 * Displays:
 * - Next upcoming appointment card (doctor, date/time, check-in status)
 * - Hero queue card when Active_Queue_Ticket exists (mono-xl queue number, doctor, position, wait, "View Live Queue")
 * - StatCards (upcoming appointments, completed visits) with patient category color
 * - Recent 3 medical records (date, doctor, diagnosis)
 * - Quick-action controls for Book Appointment and My Queue
 * - EmptyState when no appointments and no queue ticket
 *
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6
 */
export default function PatientDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const statsGridRef = useRef<HTMLDivElement>(null)
  useStaggerReveal(statsGridRef)

  // Fetch patient dashboard data (stats + next appointment + queue ticket)
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: queryKeys.dashboard.patient(),
    queryFn: () => dashboardApi.getPatientStats(),
    staleTime: STALE_TIME_DASHBOARD,
    gcTime: GC_TIME_DASHBOARD,
    refetchInterval: 30000,
  })

  // Fetch patient's appointments (for upcoming appointment card)
  const { data: apptData, isLoading: apptLoading } = useQuery({
    queryKey: queryKeys.appointments.my(),
    queryFn: () => appointmentApi.getMy({ per_page: 10 }),
    staleTime: STALE_TIME_DASHBOARD,
    gcTime: GC_TIME_DASHBOARD,
  })

  // Fetch patient's medical records (recent 3)
  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: queryKeys.medicalRecords.my(),
    queryFn: () => medicalRecordApi.getMy({ page: 1 }),
    staleTime: STALE_TIME_RECORDS,
    gcTime: GC_TIME_RECORDS,
  })

  const stats = statsData?.data?.data as PatientDashboardData | undefined
  const appointments = apptData?.data?.data ?? apptData?.data ?? []
  const allAppointments = Array.isArray(appointments) ? appointments : []

  // Derive next upcoming appointment (status = waiting, sorted by date ascending)
  const upcomingAppointments = allAppointments
    .filter((a) => a.status === 'waiting' || a.status === 'in_progress')
    .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())

  const nextAppointment = stats?.next_appointment ?? upcomingAppointments[0] ?? null
  const activeQueueTicket = stats?.active_queue_ticket ?? null

  // Stats values
  const upcomingCount = stats?.upcoming_appointments_count ?? upcomingAppointments.length
  const completedCount = stats?.completed_visits_count ?? allAppointments.filter((a) => a.status === 'completed').length

  // Recent medical records (max 3)
  const rawRecords = stats?.recent_medical_records ?? recordsData?.data?.data ?? []
  const recentRecords: MedicalRecord[] = (Array.isArray(rawRecords) ? rawRecords : []).slice(0, 3)

  const isLoading = statsLoading && apptLoading
  const hasNoData = !nextAppointment && !activeQueueTicket && upcomingCount === 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={`Halo, ${user?.full_name ?? 'Pasien'}`}
        subtitle="Kelola antrian dan lihat riwayat medis Anda"
        category="patient"
      />

      {/* EmptyState — Requirement 16.6 */}
      {!isLoading && hasNoData && (
        <EmptyState
          icon={Calendar}
          title="Belum Ada Jadwal"
          description="Anda belum memiliki janji temu atau antrian aktif. Mulai dengan mendaftar antrian baru."
          action={{
            label: 'Daftar Antrian',
            onClick: () => navigate('/patient/book'),
          }}
        />
      )}

      {/* Hero Queue Card — Requirement 16.2 */}
      {activeQueueTicket && (
        <Card surface="elevated" padding="lg" className="relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              background: 'linear-gradient(135deg, var(--category-patient) 0%, var(--accent-primary) 100%)',
            }}
            aria-hidden="true"
          />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'var(--category-patient)' }}
              >
                Antrian Aktif
              </span>
              <Badge variant="default" className="text-xs">
                Posisi #{activeQueueTicket.current_position}
              </Badge>
            </div>

            {/* Queue number in mono-xl */}
            <div className="text-center mb-4">
              <span
                className="text-mono-xl"
                style={{ color: 'var(--accent-primary)' }}
                aria-label={`Nomor antrian ${activeQueueTicket.queue_number}`}
              >
                {activeQueueTicket.queue_number}
              </span>
            </div>

            {/* Queue details */}
            <div
              className="grid grid-cols-2 gap-4 mb-6"
              style={{ color: 'var(--text-secondary)' }}
            >
              <div className="flex items-center gap-2">
                <Stethoscope className="size-4" style={{ color: 'var(--text-tertiary)' }} aria-hidden="true" />
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Dokter</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {activeQueueTicket.doctor_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-4" style={{ color: 'var(--text-tertiary)' }} aria-hidden="true" />
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Estimasi Tunggu</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {activeQueueTicket.estimated_wait_minutes} menit
                  </p>
                </div>
              </div>
            </div>

            {/* View Live Queue action */}
            <Button
              asChild
              variant="primary"
              size="lg"
              className="w-full"
            >
              <Link to="/patient/my-queue">
                <Eye className="size-4 mr-2" />
                Lihat Antrian Live
              </Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Next Upcoming Appointment Card — Requirement 16.1 */}
      {nextAppointment && !activeQueueTicket && (
        <Card surface="raised" padding="md">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div
                className="p-2 rounded-[var(--radius-md)]"
                style={{ backgroundColor: 'color-mix(in srgb, var(--category-patient) 10%, transparent)' }}
              >
                <Calendar className="size-4" style={{ color: 'var(--category-patient)' }} />
              </div>
              Janji Temu Berikutnya
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div
                  className="w-11 h-11 rounded-[var(--radius-md)] flex items-center justify-center font-bold shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, var(--category-patient), var(--accent-primary))',
                    color: 'var(--text-inverse)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {nextAppointment.queue_number}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {nextAppointment.doctor?.user?.full_name ?? nextAppointment.doctor?.full_name ?? 'Dokter'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {nextAppointment.doctor?.specialization}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="size-3" style={{ color: 'var(--text-tertiary)' }} aria-hidden="true" />
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {formatDate(nextAppointment.appointment_date)}
                    </span>
                  </div>
                </div>
              </div>
              <Badge
                variant={
                  nextAppointment.status === 'waiting' ? 'secondary'
                  : nextAppointment.status === 'in_progress' ? 'default'
                  : 'outline'
                }
                className="text-xs"
              >
                {nextAppointment.checked_in_at ? 'Sudah Check-in' : 
                  nextAppointment.status === 'waiting' ? 'Menunggu' :
                  nextAppointment.status === 'in_progress' ? 'Ditangani' : 'Terjadwal'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* StatCards — Requirement 16.3 */}
      {(upcomingCount > 0 || completedCount > 0 || !hasNoData) && (
        <div
          ref={statsGridRef}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div className="stagger-item">
            <StatCard
              title="Janji Temu Mendatang"
              value={statsLoading ? '—' : upcomingCount}
              icon={Calendar}
              category="patient"
              animate={true}
            />
          </div>
          <div className="stagger-item">
            <StatCard
              title="Kunjungan Selesai"
              value={statsLoading ? '—' : completedCount}
              icon={CheckCircle}
              category="patient"
              animate={true}
            />
          </div>
        </div>
      )}

      {/* Quick Actions — Requirement 16.5 */}
      {!hasNoData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            to="/patient/book"
            className="flex items-center gap-4 p-4 rounded-[var(--radius-md)] border transition-all group"
            style={{
              borderColor: 'color-mix(in srgb, var(--category-patient) 20%, transparent)',
              backgroundColor: 'color-mix(in srgb, var(--category-patient) 6%, transparent)',
            }}
          >
            <div
              className="p-2.5 rounded-[var(--radius-md)] shadow-sm"
              style={{ backgroundColor: 'var(--category-patient)' }}
            >
              <CalendarPlus className="size-4" style={{ color: 'var(--text-inverse)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Daftar Antrian</p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Pilih dokter & jadwal</p>
            </div>
            <ArrowRight
              className="size-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
              style={{ color: 'var(--text-tertiary)' }}
              aria-hidden="true"
            />
          </Link>

          <Link
            to="/patient/my-queue"
            className="flex items-center gap-4 p-4 rounded-[var(--radius-md)] border transition-all group"
            style={{
              borderColor: 'color-mix(in srgb, var(--category-patient) 20%, transparent)',
              backgroundColor: 'color-mix(in srgb, var(--category-patient) 6%, transparent)',
            }}
          >
            <div
              className="p-2.5 rounded-[var(--radius-md)] shadow-sm"
              style={{ backgroundColor: 'var(--category-patient)' }}
            >
              <ListOrdered className="size-4" style={{ color: 'var(--text-inverse)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Antrian Saya</p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Pantau status antrian</p>
            </div>
            <ArrowRight
              className="size-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
              style={{ color: 'var(--text-tertiary)' }}
              aria-hidden="true"
            />
          </Link>
        </div>
      )}

      {/* Recent Medical Records — Requirement 16.4 */}
      {(recentRecords.length > 0 || recordsLoading) && (
        <Card surface="raised">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2.5">
              <div
                className="p-2 rounded-[var(--radius-md)]"
                style={{ backgroundColor: 'color-mix(in srgb, var(--category-patient) 10%, transparent)' }}
              >
                <FileText className="size-4" style={{ color: 'var(--category-patient)' }} />
              </div>
              Rekam Medis Terbaru
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link to="/patient/medical-history">Lihat Semua</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recordsLoading ? (
              <LoadingSkeleton variant="list-item" count={3} />
            ) : recentRecords.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: 'var(--text-tertiary)' }}>
                Belum ada rekam medis.
              </p>
            ) : (
              <div className="space-y-3">
                {recentRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 rounded-[var(--radius-md)] border transition-all"
                    style={{
                      borderColor: 'var(--border-default)',
                      backgroundColor: 'var(--surface-sunken)',
                    }}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--category-doctor) 10%, transparent)',
                        }}
                      >
                        <Stethoscope className="size-4" style={{ color: 'var(--category-doctor)' }} aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {record.doctor?.user?.full_name ?? record.doctor?.full_name ?? 'Dokter'}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                          {record.diagnosis ?? record.complaint ?? '—'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {formatDate(record.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
