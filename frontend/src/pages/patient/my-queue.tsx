import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Clock,
  Stethoscope,
  QrCode,
  ListOrdered,
  Bell,
  CheckCircle2,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { dashboardApi } from '@/api/dashboard'
import { appointmentApi } from '@/api/appointments'
import { queryKeys, STALE_TIME_DASHBOARD, GC_TIME_DASHBOARD } from '@/lib/query-keys'

import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { DisconnectionBanner } from '@/components/shared/disconnection-banner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { useRealtimeSync } from '@/hooks/use-realtime-sync'
import type { QueueTicket, QueueUpdateEvent, PatientDashboardData } from '@/types'
import type { RealtimeMessage } from '@/hooks/use-realtime-sync'

/**
 * PatientMyQueuePage — Live queue position page for patients.
 *
 * Displays:
 * - Hero queue card with mono-xl number, doctor, current position,
 *   estimated wait, and progress visualization (transform + opacity)
 * - "You are next" notice when position === 1 (non-modal alert)
 * - Confirmation message when status transitions to In Consultation
 * - EmptyState when no active ticket (actions: Book Appointment / Check-in)
 * - Integrates use-realtime-sync for queue_update events (update within 1000ms)
 * - aria-live announcement on queue position changes
 *
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6
 */
export default function PatientMyQueuePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Track last update time for disconnection banner
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  // Track previous position for transition detection
  const [prevStatus, setPrevStatus] = useState<string | null>(null)
  // Track if status just transitioned to in_consultation
  const [showConsultationConfirmation, setShowConsultationConfirmation] = useState(false)
  // aria-live announcement text
  const [liveAnnouncement, setLiveAnnouncement] = useState('')

  // Fetch patient dashboard data (includes active_queue_ticket)
  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: queryKeys.dashboard.patient(),
    queryFn: () => dashboardApi.getPatientStats(),
    staleTime: STALE_TIME_DASHBOARD,
    gcTime: GC_TIME_DASHBOARD,
    refetchInterval: 30000,
  })

  // Also fetch appointments for fallback
  const { data: apptData, isLoading: apptLoading } = useQuery({
    queryKey: queryKeys.appointments.my(),
    queryFn: () => appointmentApi.getMy({ per_page: 10 }),
    staleTime: STALE_TIME_DASHBOARD,
    gcTime: GC_TIME_DASHBOARD,
  })

  // Extract active queue ticket from dashboard data
  const stats = dashData?.data?.data as PatientDashboardData | undefined
  const activeTicket: QueueTicket | null = stats?.active_queue_ticket ?? null

  // Fallback: derive from appointments if dashboard doesn't provide it
  const appointments = apptData?.data?.data ?? []
  const activeAppointment = Array.isArray(appointments)
    ? appointments.find((a) => a.status === 'waiting' || a.status === 'in_progress')
    : null

  // Derive ticket data from either source
  const ticket: QueueTicket | null = activeTicket ?? (activeAppointment ? {
    queue_number: activeAppointment.queue_number,
    doctor_id: activeAppointment.doctor_id,
    doctor_name: activeAppointment.doctor?.user?.full_name ?? 'Dokter',
    patient_id: activeAppointment.patient_id ?? '',
    current_position: activeAppointment.queue_number,
    estimated_wait_minutes: (activeAppointment.queue_number - 1) * 10,
    status: activeAppointment.status === 'in_progress' ? 'in_consultation' : 'waiting',
    appointment_id: activeAppointment.id,
  } : null)

  // Detect status transition to in_consultation (Requirement 18.4)
  useEffect(() => {
    if (ticket && prevStatus && prevStatus !== ticket.status) {
      if (ticket.status === 'in_consultation') {
        setShowConsultationConfirmation(true)
        setLiveAnnouncement('Anda sedang ditangani oleh dokter. Silakan menuju ruang konsultasi.')
      }
    }
    if (ticket) {
      setPrevStatus(ticket.status)
    }
  }, [ticket?.status])

  // Realtime sync for queue_update events (Requirement 18.5)
  const handleRealtimeMessage = useCallback((message: RealtimeMessage) => {
    if (message.type === 'queue_update') {
      const event = message.data as QueueUpdateEvent
      // Invalidate queries to get fresh data within 1000ms
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.patient() })
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.my() })
      setLastUpdated(new Date())

      // Update aria-live announcement
      if (ticket && event.doctor_id === ticket.doctor_id) {
        const newPosition = ticket.queue_number - event.current_number
        if (newPosition === 1) {
          setLiveAnnouncement('Anda berikutnya! Bersiaplah untuk dipanggil.')
        } else if (newPosition > 0) {
          setLiveAnnouncement(`Posisi antrian Anda sekarang: ${newPosition}`)
        }
      }
    }
  }, [ticket, queryClient])

  const { connectionState } = useRealtimeSync({
    channels: ['queue_update'],
    onMessage: handleRealtimeMessage,
    refetchKeys: [[...queryKeys.dashboard.patient()], [...queryKeys.appointments.my()]],
    pollingFallback: true,
    pollingInterval: 30000,
  })

  const isLoading = dashLoading && apptLoading
  const isDisconnected = connectionState === 'disconnected' || connectionState === 'reconnecting'

  // Progress visualization: based on position (lower position = more progress)
  const getProgressWidth = () => {
    if (!ticket) return 0
    if (ticket.status === 'in_consultation') return 100
    if (ticket.current_position <= 1) return 90
    if (ticket.current_position <= 3) return 70
    if (ticket.current_position <= 5) return 50
    return 30
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Antrian Saya"
        subtitle="Pantau posisi antrian Anda secara real-time"
        category="patient"
      />

      {/* Disconnection Banner (Requirement 25.4) */}
      {isDisconnected && (
        <DisconnectionBanner
          state={connectionState === 'reconnecting' ? 'reconnecting' : 'disconnected'}
          lastUpdated={lastUpdated}
        />
      )}

      {/* aria-live region for screen reader announcements (Requirement 18.5) */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveAnnouncement}
      </div>

      {/* Loading State */}
      {isLoading && (
        <LoadingSkeleton variant="card" count={1} />
      )}

      {/* In Consultation Confirmation (Requirement 18.4) */}
      {showConsultationConfirmation && (
        <Card surface="elevated" padding="lg" className="relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-8"
            style={{
              background: 'linear-gradient(135deg, var(--accent-success, #059669) 0%, var(--category-patient) 100%)',
            }}
            aria-hidden="true"
          />
          <CardContent className="relative z-10">
            <div className="flex flex-col items-center text-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-success, #059669) 12%, transparent)',
                }}
              >
                <CheckCircle2
                  className="size-8"
                  style={{ color: 'var(--accent-success, #059669)' }}
                  aria-hidden="true"
                />
              </div>
              <div>
                <h2
                  className="text-heading-md font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Anda Sedang Ditangani
                </h2>
                <p
                  className="text-body-md mt-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Silakan menuju ruang konsultasi dokter Anda.
                </p>
              </div>
              {ticket && (
                <div className="flex items-center gap-2 mt-2">
                  <Stethoscope className="size-4" style={{ color: 'var(--text-tertiary)' }} aria-hidden="true" />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {ticket.doctor_name}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hero Queue Card (Requirement 18.1, 18.2, 18.3) */}
      {!isLoading && ticket && ticket.status !== 'in_consultation' && (
        <Card surface="elevated" padding="lg" className="relative overflow-hidden">
          {/* Background gradient */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              background: 'linear-gradient(135deg, var(--category-patient) 0%, var(--accent-primary) 100%)',
            }}
            aria-hidden="true"
          />

          <CardContent className="relative z-10">
            {/* Header label */}
            <div className="flex items-center justify-between mb-6">
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'var(--category-patient)' }}
              >
                Antrian Aktif
              </span>
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--category-patient) 10%, transparent)',
                  color: 'var(--category-patient)',
                }}
              >
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: 'var(--category-patient)' }}
                  aria-hidden="true"
                />
                Live
              </div>
            </div>

            {/* Queue Number — mono-xl (Requirement 18.1) */}
            <div className="text-center mb-6">
              <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
                Nomor Antrian
              </p>
              <span
                className="text-mono-xl"
                style={{
                  color: 'var(--accent-primary)',
                  transition: 'transform var(--duration-normal, 300ms) ease, opacity var(--duration-normal, 300ms) ease',
                }}
                aria-label={`Nomor antrian ${ticket.queue_number}`}
              >
                {ticket.queue_number}
              </span>
            </div>

            {/* Queue Details Grid */}
            <div
              className="grid grid-cols-2 gap-4 mb-6"
              style={{ color: 'var(--text-secondary)' }}
            >
              {/* Doctor */}
              <div className="flex items-center gap-2.5">
                <div
                  className="p-2 rounded-[var(--radius-md)]"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--category-doctor) 10%, transparent)' }}
                >
                  <Stethoscope className="size-4" style={{ color: 'var(--category-doctor)' }} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Dokter</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {ticket.doctor_name}
                  </p>
                </div>
              </div>

              {/* Current Position */}
              <div className="flex items-center gap-2.5">
                <div
                  className="p-2 rounded-[var(--radius-md)]"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--category-patient) 10%, transparent)' }}
                >
                  <ListOrdered className="size-4" style={{ color: 'var(--category-patient)' }} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Posisi</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    #{ticket.current_position}
                  </p>
                </div>
              </div>

              {/* Estimated Wait */}
              <div className="flex items-center gap-2.5">
                <div
                  className="p-2 rounded-[var(--radius-md)]"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--accent-warning, #d97706) 10%, transparent)' }}
                >
                  <Clock className="size-4" style={{ color: 'var(--accent-warning, #d97706)' }} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Estimasi Tunggu</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {ticket.estimated_wait_minutes} menit
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2.5">
                <div
                  className="p-2 rounded-[var(--radius-md)]"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--accent-success, #059669) 10%, transparent)' }}
                >
                  <CheckCircle2 className="size-4" style={{ color: 'var(--accent-success, #059669)' }} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Status</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {ticket.status === 'waiting' ? 'Menunggu' : 'Dipanggil'}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Visualization (transform + opacity) — Requirement 18.1 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  Progres Antrian
                </span>
                <span className="text-xs font-medium" style={{ color: 'var(--category-patient)' }}>
                  {getProgressWidth()}%
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: 'color-mix(in srgb, var(--category-patient) 12%, transparent)' }}
                role="progressbar"
                aria-valuenow={getProgressWidth()}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progres antrian"
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${getProgressWidth()}%`,
                    backgroundColor: 'var(--category-patient)',
                    transform: 'translateX(0)',
                    opacity: 1,
                    transition: 'transform var(--duration-normal, 300ms) ease, opacity var(--duration-normal, 300ms) ease, width var(--duration-normal, 300ms) ease',
                  }}
                />
              </div>
            </div>

            {/* "You are next" notice — Requirement 18.3 */}
            {ticket.current_position === 1 && (
              <div
                role="alert"
                aria-live="assertive"
                className="flex items-center gap-3 p-4 rounded-[var(--radius-md)] mb-4"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-success, #059669) 10%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--accent-success, #059669) 25%, transparent)',
                }}
              >
                <div
                  className="p-2 rounded-full shrink-0"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--accent-success, #059669) 15%, transparent)' }}
                >
                  <Bell
                    className="size-5 animate-bounce"
                    style={{ color: 'var(--accent-success, #059669)' }}
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: 'var(--accent-success, #059669)' }}
                  >
                    Anda Berikutnya!
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Bersiaplah, Anda akan segera dipanggil oleh dokter.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* EmptyState — Requirement 18.6 */}
      {!isLoading && !ticket && !showConsultationConfirmation && (
        <EmptyState
          icon={ListOrdered}
          title="Tidak Ada Antrian Aktif"
          description="Anda belum memiliki antrian aktif saat ini. Daftar antrian baru atau lakukan check-in di klinik."
          action={{
            label: 'Daftar Antrian',
            onClick: () => navigate('/patient/book'),
          }}
        />
      )}

      {/* Secondary action for empty state: Check-in */}
      {!isLoading && !ticket && !showConsultationConfirmation && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="md"
            asChild
          >
            <Link to="/check-in">
              <QrCode className="size-4 mr-2" aria-hidden="true" />
              Check-in di Klinik
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
