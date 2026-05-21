import { useState, useCallback, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronRight,
  CheckCircle,
  UserCheck,
  Clock,
  Users,
  MoreVertical,
  XCircle,
  RotateCcw,
} from 'lucide-react'
import { appointmentApi } from '@/api/appointments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/page-header'
import { useRealtimeSync, type RealtimeMessage } from '@/hooks/use-realtime-sync'
import { queryKeys, queryConfig } from '@/lib/query-keys'
import { toast } from '@/hooks/use-toast'
import type { Appointment } from '@/types'
import MedicalRecordForm from './medical-record-form.tsx'

// ── Types ──

type LaneStatus = 'waiting' | 'in_progress' | 'completed'

interface PatientCardProps {
  appointment: Appointment
  lane: LaneStatus
  onCallNext?: () => void
  onMarkInConsultation?: () => void
  onComplete?: () => void
  onNoShow?: () => void
  isAnimating?: boolean
}

// ── Helpers ──

function formatScheduledTime(schedule?: { start_time?: string }): string {
  if (!schedule?.start_time) return '—'
  return schedule.start_time.slice(0, 5)
}

function getChiefComplaint(appointment: Appointment): string | undefined {
  // Chief complaint may come from symptom screening or medical record
  return (appointment as unknown as Record<string, unknown>).chief_complaint as string | undefined
}

// ── PatientCard Component ──

function PatientCard({
  appointment,
  lane,
  onMarkInConsultation,
  onComplete,
  onNoShow,
  isAnimating,
}: PatientCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const chiefComplaint = getChiefComplaint(appointment)
  const patientName = appointment.patient?.user?.full_name ?? appointment.patient?.full_name ?? 'Pasien'

  return (
    <div
      className="relative p-4 rounded-[var(--radius-md)] border transition-all"
      style={{
        borderColor: 'var(--border-default, #e8e2da)',
        backgroundColor: 'var(--surface-raised, #ffffff)',
        transitionProperty: 'transform, opacity',
        transitionDuration: 'var(--duration-normal, 250ms)',
        transitionTimingFunction: 'ease-in-out',
        opacity: isAnimating ? 0 : 1,
        transform: isAnimating ? 'translateY(-8px) scale(0.97)' : 'translateY(0) scale(1)',
      }}
      role="article"
      aria-label={`Pasien ${patientName}, antrian nomor ${appointment.queue_number}`}
    >
      <div className="flex items-start gap-3">
        {/* Queue Number */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center font-mono text-lg font-bold shrink-0"
          style={{
            background: lane === 'in_progress'
              ? 'linear-gradient(135deg, var(--category-doctor), var(--accent-primary))'
              : lane === 'completed'
                ? 'var(--accent-success)'
                : 'var(--surface-sunken)',
            color: lane === 'waiting' ? 'var(--text-primary)' : 'var(--text-inverse)',
            boxShadow: lane !== 'waiting' ? 'var(--shadow-sm)' : 'none',
          }}
          aria-label={`Nomor antrian ${appointment.queue_number}`}
        >
          {appointment.queue_number}
        </div>

        {/* Patient Info */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {patientName}
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <Clock className="inline size-3 mr-1" style={{ verticalAlign: '-2px' }} />
            {formatScheduledTime(appointment.schedule)}
          </p>
          {chiefComplaint && (
            <p
              className="text-xs mt-1 truncate"
              style={{ color: 'var(--text-secondary)' }}
              title={chiefComplaint}
            >
              {chiefComplaint}
            </p>
          )}
        </div>

        {/* Action Menu */}
        {lane !== 'completed' && (
          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu aksi"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <MoreVertical className="size-4" />
            </Button>

            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-[var(--radius-md)] border py-1"
                style={{
                  backgroundColor: 'var(--surface-raised)',
                  borderColor: 'var(--border-default)',
                  boxShadow: 'var(--shadow-lg)',
                }}
                role="menu"
                aria-label="Aksi pasien"
              >
                {lane === 'waiting' && onMarkInConsultation && (
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-[var(--surface-sunken)]"
                    style={{ color: 'var(--text-primary)' }}
                    onClick={() => { onMarkInConsultation(); setMenuOpen(false) }}
                    role="menuitem"
                  >
                    <UserCheck className="size-4" style={{ color: 'var(--category-doctor)' }} />
                    Mulai Konsultasi
                  </button>
                )}
                {lane === 'in_progress' && onComplete && (
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-[var(--surface-sunken)]"
                    style={{ color: 'var(--text-primary)' }}
                    onClick={() => { onComplete(); setMenuOpen(false) }}
                    role="menuitem"
                  >
                    <CheckCircle className="size-4" style={{ color: 'var(--accent-success)' }} />
                    Selesai Konsultasi
                  </button>
                )}
                {onNoShow && (
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-[var(--surface-sunken)]"
                    style={{ color: 'var(--accent-danger)' }}
                    onClick={() => { onNoShow(); setMenuOpen(false) }}
                    role="menuitem"
                  >
                    <XCircle className="size-4" />
                    Tandai Tidak Hadir
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Medical Record Modal ──

interface MedicalRecordModalProps {
  appointment: Appointment
  onDone: () => void
  onSkip: () => void
}

function MedicalRecordModal({ appointment, onDone, onSkip }: MedicalRecordModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Buat Rekam Medis"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={onSkip}
        aria-hidden="true"
      />
      {/* Content */}
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[var(--radius-lg)] p-6 mx-4"
        style={{
          backgroundColor: 'var(--surface-raised)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <MedicalRecordForm
          appointment={appointment}
          onDone={onDone}
          onBack={onSkip}
        />
      </div>
    </div>
  )
}

// ── Main Component ──

export default function DoctorQueuePage() {
  const queryClient = useQueryClient()

  // ── Local State ──
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  const [completingAppointment, setCompletingAppointment] = useState<Appointment | null>(null)
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set())

  // Track in-progress form to preserve on realtime reconciliation
  const formInProgressRef = useRef(false)

  // ── Data Fetching ──

  const { data, isLoading } = useQuery({
    queryKey: [...queryKeys.appointments.todayQueue(), selectedDate],
    queryFn: () => appointmentApi.getTodayQueue(selectedDate),
    staleTime: queryConfig.dashboard.staleTime,
    gcTime: queryConfig.dashboard.gcTime,
  })

  const queue: Appointment[] = data?.data?.data ?? []
  const waiting = queue.filter(a => a.status === 'waiting')
  const inProgress = queue.filter(a => a.status === 'in_progress')
  const completed = queue.filter(a => a.status === 'completed')

  // ── Optimistic Mutation ──

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      appointmentApi.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [...queryKeys.appointments.todayQueue(), selectedDate] })

      // Snapshot previous value
      const previousQueue = queryClient.getQueryData([...queryKeys.appointments.todayQueue(), selectedDate])

      // Optimistically update
      queryClient.setQueryData(
        [...queryKeys.appointments.todayQueue(), selectedDate],
        (old: unknown) => {
          if (!old || typeof old !== 'object') return old
          const oldData = old as { data?: { data?: Appointment[] } }
          if (!oldData.data?.data) return old
          return {
            ...oldData,
            data: {
              ...oldData.data,
              data: oldData.data.data.map(a =>
                a.id === id ? { ...a, status } : a
              ),
            },
          }
        }
      )

      return { previousQueue }
    },
    onSuccess: (_, variables) => {
      if (variables.status === 'in_progress') {
        toast.success('Pasien dipanggil', 'Pasien sedang ditangani.')
      }
      if (variables.status === 'completed') {
        toast.success('Kunjungan selesai', 'Status pasien telah diperbarui.')
      }
      if (variables.status === 'no_show') {
        toast.info('Pasien tidak hadir', 'Status telah ditandai sebagai tidak hadir.')
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.todayQueue() })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.doctor() })
    },
    onError: (_err, _variables, context) => {
      // Revert optimistic update
      if (context?.previousQueue) {
        queryClient.setQueryData(
          [...queryKeys.appointments.todayQueue(), selectedDate],
          context.previousQueue
        )
      }
      toast.error('Gagal memperbarui status', 'Terjadi kesalahan saat memperbarui antrian. Silakan coba lagi.')
    },
  })

  // ── Actions ──

  const animateTransition = useCallback((id: string, callback: () => void) => {
    setAnimatingIds(prev => new Set(prev).add(id))
    setTimeout(() => {
      callback()
      setAnimatingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 250) // matches var(--duration-normal)
  }, [])

  const callNext = useCallback(() => {
    if (waiting.length === 0) return
    const first = waiting[0]
    animateTransition(first.id, () => {
      statusMutation.mutate({ id: first.id, status: 'in_progress' })
    })
  }, [waiting, animateTransition, statusMutation])

  const markInConsultation = useCallback((appointment: Appointment) => {
    animateTransition(appointment.id, () => {
      statusMutation.mutate({ id: appointment.id, status: 'in_progress' })
    })
  }, [animateTransition, statusMutation])

  const handleComplete = useCallback((appointment: Appointment) => {
    // Block transition until medical record form is submitted or skipped
    setCompletingAppointment(appointment)
    formInProgressRef.current = true
  }, [])

  const handleMedicalRecordDone = useCallback(() => {
    if (!completingAppointment) return
    const appt = completingAppointment
    setCompletingAppointment(null)
    formInProgressRef.current = false
    animateTransition(appt.id, () => {
      statusMutation.mutate({ id: appt.id, status: 'completed' })
    })
  }, [completingAppointment, animateTransition, statusMutation])

  const handleMedicalRecordSkip = useCallback(() => {
    if (!completingAppointment) return
    const appt = completingAppointment
    setCompletingAppointment(null)
    formInProgressRef.current = false
    animateTransition(appt.id, () => {
      statusMutation.mutate({ id: appt.id, status: 'completed' })
    })
  }, [completingAppointment, animateTransition, statusMutation])

  const markNoShow = useCallback((appointment: Appointment) => {
    animateTransition(appointment.id, () => {
      statusMutation.mutate({ id: appointment.id, status: 'no_show' })
    })
  }, [animateTransition, statusMutation])

  // ── Realtime Sync ──

  const handleRealtimeMessage = useCallback(
    (message: RealtimeMessage) => {
      if (message.type === 'queue_update') {
        // Preserve in-progress form: don't refetch if form is open
        if (formInProgressRef.current) return
        // Reconcile within 1000ms by invalidating the query
        queryClient.invalidateQueries({ queryKey: [...queryKeys.appointments.todayQueue(), selectedDate] })
      }
    },
    [queryClient, selectedDate]
  )

  const { connectionState } = useRealtimeSync({
    channels: ['queue_update'],
    onMessage: handleRealtimeMessage,
    refetchKeys: [[...queryKeys.appointments.todayQueue(), selectedDate]],
  })

  // ── Render ──

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Antrian Pasien"
        subtitle={new Date(selectedDate).toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
        category="doctor"
        actions={
          <div className="flex items-center gap-3">
            {/* Connection indicator */}
            {connectionState === 'connected' && (
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
            )}
            {connectionState === 'reconnecting' && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)]"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-warning) 10%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--accent-warning) 20%, transparent)',
                }}
                role="status"
                aria-live="polite"
              >
                <RotateCcw className="size-3 animate-spin" style={{ color: 'var(--accent-warning)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--accent-warning)' }}>
                  Reconnecting...
                </span>
              </div>
            )}

            {/* Date picker */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-[var(--radius-md)] border text-sm font-medium transition-all"
              style={{
                borderColor: 'var(--border-default)',
                backgroundColor: 'var(--surface-raised)',
                color: 'var(--text-primary)',
              }}
              aria-label="Pilih tanggal"
            />

            {/* Call Next Button */}
            <Button
              variant="primary"
              size="lg"
              onClick={callNext}
              disabled={waiting.length === 0 || statusMutation.isPending}
              loading={statusMutation.isPending}
              leftIcon={<ChevronRight className="size-4" />}
              aria-label="Panggil pasien berikutnya"
            >
              Panggil Berikutnya
            </Button>
          </div>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Menunggu',
            count: waiting.length,
            icon: Clock,
            color: 'var(--accent-warning)',
          },
          {
            label: 'Konsultasi',
            count: inProgress.length,
            icon: UserCheck,
            color: 'var(--category-doctor)',
          },
          {
            label: 'Selesai',
            count: completed.length,
            icon: CheckCircle,
            color: 'var(--accent-success)',
          },
        ].map(({ label, count, icon: Icon, color }) => (
          <Card key={label} surface="raised" padding="sm">
            <CardContent className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-[var(--radius-md)]"
                style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
              >
                <Icon className="size-4" style={{ color }} />
              </div>
              <div>
                <p
                  className="text-2xl font-bold font-mono"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {count}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Queue Lanes */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} surface="raised" padding="none">
              <CardHeader className="px-5 pt-5 pb-3">
                <div className="h-5 w-32 skeleton rounded" />
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-3">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-3 p-3">
                    <div className="w-11 h-11 rounded-full skeleton" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-28 skeleton rounded" />
                      <div className="h-3 w-20 skeleton rounded" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          role="region"
          aria-label="Antrian pasien"
        >
          {/* Waiting Lane */}
          <Card surface="raised" padding="none">
            <CardHeader className="px-5 pt-5 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div
                  className="p-1.5 rounded-[var(--radius-sm)]"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--accent-warning) 12%, transparent)' }}
                >
                  <Clock className="size-3.5" style={{ color: 'var(--accent-warning)' }} />
                </div>
                <span>Menunggu</span>
                <span
                  className="ml-auto text-sm font-mono px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--accent-warning) 10%, transparent)',
                    color: 'var(--accent-warning)',
                  }}
                >
                  {waiting.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-2">
              {waiting.length === 0 ? (
                <div className="flex flex-col items-center py-10" style={{ color: 'var(--text-tertiary)' }}>
                  <Users className="size-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">Tidak ada antrian menunggu</p>
                </div>
              ) : (
                waiting.map((appt) => (
                  <PatientCard
                    key={appt.id}
                    appointment={appt}
                    lane="waiting"
                    onMarkInConsultation={() => markInConsultation(appt)}
                    onNoShow={() => markNoShow(appt)}
                    isAnimating={animatingIds.has(appt.id)}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* In Consultation Lane */}
          <Card
            surface="raised"
            padding="none"
            style={{
              borderColor: 'color-mix(in srgb, var(--category-doctor) 25%, transparent)',
              borderWidth: '2px',
            }}
          >
            <CardHeader className="px-5 pt-5 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div
                  className="p-1.5 rounded-[var(--radius-sm)]"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--category-doctor) 12%, transparent)' }}
                >
                  <UserCheck className="size-3.5" style={{ color: 'var(--category-doctor)' }} />
                </div>
                <span>Konsultasi</span>
                <span
                  className="ml-auto text-sm font-mono px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--category-doctor) 10%, transparent)',
                    color: 'var(--category-doctor)',
                  }}
                >
                  {inProgress.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-2">
              {inProgress.length === 0 ? (
                <div className="flex flex-col items-center py-10" style={{ color: 'var(--text-tertiary)' }}>
                  <UserCheck className="size-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium text-center">
                    Klik "Panggil Berikutnya"<br />untuk mulai konsultasi
                  </p>
                </div>
              ) : (
                inProgress.map((appt) => (
                  <PatientCard
                    key={appt.id}
                    appointment={appt}
                    lane="in_progress"
                    onComplete={() => handleComplete(appt)}
                    onNoShow={() => markNoShow(appt)}
                    isAnimating={animatingIds.has(appt.id)}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Completed Lane */}
          <Card surface="raised" padding="none">
            <CardHeader className="px-5 pt-5 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div
                  className="p-1.5 rounded-[var(--radius-sm)]"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--accent-success) 12%, transparent)' }}
                >
                  <CheckCircle className="size-3.5" style={{ color: 'var(--accent-success)' }} />
                </div>
                <span>Selesai</span>
                <span
                  className="ml-auto text-sm font-mono px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--accent-success) 10%, transparent)',
                    color: 'var(--accent-success)',
                  }}
                >
                  {completed.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-2">
              {completed.length === 0 ? (
                <div className="flex flex-col items-center py-10" style={{ color: 'var(--text-tertiary)' }}>
                  <CheckCircle className="size-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">Belum ada kunjungan selesai</p>
                </div>
              ) : (
                completed.map((appt) => (
                  <PatientCard
                    key={appt.id}
                    appointment={appt}
                    lane="completed"
                    isAnimating={animatingIds.has(appt.id)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Medical Record Modal — blocks completion until submitted or skipped */}
      {completingAppointment && (
        <MedicalRecordModal
          appointment={completingAppointment}
          onDone={handleMedicalRecordDone}
          onSkip={handleMedicalRecordSkip}
        />
      )}
    </div>
  )
}
