import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ClipboardList,
  Filter,
  RefreshCw,
  XCircle,
  Download,
  CalendarDays,
  List,
} from 'lucide-react'
import { appointmentApi, exportApi } from '@/api/appointments'
import { doctorApi, scheduleApi } from '@/api/doctors'
import { toast } from '@/hooks/use-toast'
import { useDebouncedSearch } from '@/hooks/use-debounced-search'
import { useRealtimeSync, type RealtimeMessage } from '@/hooks/use-realtime-sync'
import { queryKeys, queryConfig } from '@/lib/query-keys'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, type Column } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { Appointment, Doctor, DoctorSchedule, AppointmentStatus } from '@/types'

// ── Constants ───────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: AppointmentStatus | ''; label: string }[] = [
  { value: '', label: 'Semua Status' },
  { value: 'waiting', label: 'Menunggu' },
  { value: 'in_progress', label: 'Ditangani' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

// Doctor color palette for calendar view
const DOCTOR_COLORS = [
  'var(--category-doctor)',
  'var(--category-admin)',
  'var(--accent-primary)',
  'var(--category-queue)',
  'var(--accent-success)',
  'var(--accent-warning)',
  'var(--category-patient)',
]

// ── Helpers ─────────────────────────────────────────────────────────────────

function getTodayDateString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function formatTime(timeStr?: string): string {
  if (!timeStr) return '—'
  return timeStr.slice(0, 5)
}

function statusLabel(s: string): string {
  switch (s) {
    case 'waiting': return 'Menunggu'
    case 'in_progress': return 'Ditangani'
    case 'completed': return 'Selesai'
    case 'cancelled': return 'Dibatalkan'
    default: return s
  }
}

function statusVariant(s: string): 'warning' | 'default' | 'success' | 'destructive' | 'outline' {
  switch (s) {
    case 'waiting': return 'warning'
    case 'in_progress': return 'default'
    case 'completed': return 'success'
    case 'cancelled': return 'destructive'
    default: return 'outline'
  }
}

function getDoctorColor(index: number): string {
  return DOCTOR_COLORS[index % DOCTOR_COLORS.length]
}

/** Generate dates for the next N days from a start date */
function getDateRange(startDate: Date, days: number): Date[] {
  const dates: Date[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    dates.push(d)
  }
  return dates
}

/** Get the Monday of the week containing the given date */
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// ── Reschedule Modal ────────────────────────────────────────────────────────

interface RescheduleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: Appointment | null
  onSuccess: () => void
}

function RescheduleModal({ open, onOpenChange, appointment, onSuccess }: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedScheduleId, setSelectedScheduleId] = useState('')
  const [error, setError] = useState('')

  const doctorId = appointment?.doctor_id ?? ''

  // Fetch available schedules for the doctor
  const { data: schedulesData, isLoading: schedulesLoading } = useQuery({
    queryKey: [...queryKeys.schedules.byDoctor(doctorId), 'reschedule'],
    queryFn: () => scheduleApi.getByDoctor(doctorId),
    enabled: open && !!doctorId,
    staleTime: queryConfig.schedules.staleTime,
    gcTime: queryConfig.schedules.gcTime,
  })

  const schedules: DoctorSchedule[] = schedulesData?.data?.data ?? []

  // Generate next 14 days
  const next14Days = useMemo(() => {
    return getDateRange(new Date(), 14)
  }, [])

  // Filter schedules by selected date's day of week
  const availableSlots = useMemo(() => {
    if (!selectedDate) return []
    const date = new Date(selectedDate)
    const dayOfWeek = date.getDay() // 0=Sunday, 1=Monday, ...
    return schedules.filter((s) => s.day_of_week === dayOfWeek && s.is_active)
  }, [selectedDate, schedules])

  const rescheduleMutation = useMutation({
    mutationFn: () => {
      if (!appointment) throw new Error('No appointment selected')
      return appointmentApi.reschedule(appointment.id, {
        schedule_id: selectedScheduleId,
        appointment_date: selectedDate,
      })
    },
    onSuccess: () => {
      toast.success('Janji temu berhasil dijadwalkan ulang')
      onSuccess()
      onOpenChange(false)
      setSelectedDate('')
      setSelectedScheduleId('')
      setError('')
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e?.response?.data?.message || 'Gagal menjadwalkan ulang')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!selectedDate || !selectedScheduleId) {
      setError('Pilih tanggal dan slot waktu')
      return
    }
    rescheduleMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Jadwalkan Ulang</DialogTitle>
          <DialogDescription>
            Pilih tanggal dan slot baru untuk pasien{' '}
            <strong>{appointment?.patient?.user?.full_name ?? appointment?.patient?.full_name ?? 'ini'}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              className="p-3 rounded-[var(--radius-md)] text-sm"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent-danger) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--accent-danger) 25%, transparent)',
                color: 'var(--accent-danger)',
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Date selection */}
          <div className="space-y-1.5">
            <label htmlFor="reschedule-date" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Pilih Tanggal (14 hari ke depan) *
            </label>
            <select
              id="reschedule-date"
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setSelectedScheduleId('') }}
              className="w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border-2 border-[color-mix(in_srgb,var(--text-primary)_15%,transparent)] bg-[var(--surface-raised)] text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2"
              required
            >
              <option value="">— Pilih tanggal —</option>
              {next14Days.map((d) => {
                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                const dayName = DAY_NAMES[d.getDay()]
                return (
                  <option key={dateStr} value={dateStr}>
                    {dayName}, {d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </option>
                )
              })}
            </select>
          </div>

          {/* Slot selection */}
          {selectedDate && (
            <div className="space-y-1.5">
              <label htmlFor="reschedule-slot" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Pilih Slot Waktu *
              </label>
              {schedulesLoading ? (
                <div className="py-4 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Memuat slot...
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="py-4 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Tidak ada slot tersedia pada tanggal ini
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedScheduleId(slot.id)}
                      className="flex items-center justify-between p-3 rounded-[var(--radius-md)] border-2 transition-all text-left"
                      style={{
                        borderColor: selectedScheduleId === slot.id
                          ? 'var(--accent-primary)'
                          : 'color-mix(in srgb, var(--text-primary) 12%, transparent)',
                        backgroundColor: selectedScheduleId === slot.id
                          ? 'color-mix(in srgb, var(--accent-primary) 6%, transparent)'
                          : 'var(--surface-raised)',
                      }}
                    >
                      <div>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                        </span>
                        <span className="text-xs ml-2" style={{ color: 'var(--text-tertiary)' }}>
                          (maks {slot.max_patient} pasien)
                        </span>
                      </div>
                      {selectedScheduleId === slot.id && (
                        <span className="text-xs font-semibold" style={{ color: 'var(--accent-primary)' }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-6 gap-3 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={rescheduleMutation.isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={rescheduleMutation.isPending}
              disabled={!selectedDate || !selectedScheduleId}
            >
              Jadwalkan Ulang
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Cancel Modal ────────────────────────────────────────────────────────────

interface CancelModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: Appointment | null
  onSuccess: () => void
}

function CancelModal({ open, onOpenChange, appointment, onSuccess }: CancelModalProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const cancelMutation = useMutation({
    mutationFn: () => {
      if (!appointment) throw new Error('No appointment selected')
      return appointmentApi.cancel(appointment.id, reason)
    },
    onSuccess: () => {
      toast.success('Janji temu berhasil dibatalkan')
      onSuccess()
      onOpenChange(false)
      setReason('')
      setError('')
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e?.response?.data?.message || 'Gagal membatalkan janji temu')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (reason.length < 10) {
      setError('Alasan pembatalan minimal 10 karakter')
      return
    }
    cancelMutation.mutate()
  }

  const isValid = reason.length >= 10

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Batalkan Janji Temu</DialogTitle>
          <DialogDescription>
            Masukkan alasan pembatalan untuk pasien{' '}
            <strong>{appointment?.patient?.user?.full_name ?? appointment?.patient?.full_name ?? 'ini'}</strong>.
            Alasan minimal 10 karakter.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              className="p-3 rounded-[var(--radius-md)] text-sm"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent-danger) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--accent-danger) 25%, transparent)',
                color: 'var(--accent-danger)',
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="cancel-reason" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Alasan Pembatalan *
            </label>
            <textarea
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Masukkan alasan pembatalan (minimal 10 karakter)..."
              rows={3}
              required
              minLength={10}
              className="flex w-full px-4 py-3 text-sm rounded-[var(--radius-md)] bg-[var(--surface-raised)] text-[var(--text-primary)] border-2 border-[color-mix(in_srgb,var(--text-primary)_15%,transparent)] placeholder:text-[var(--text-tertiary)] transition-all duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2"
              aria-describedby="cancel-reason-hint"
            />
            <p
              id="cancel-reason-hint"
              className="text-xs"
              style={{ color: isValid ? 'var(--accent-success)' : 'var(--text-tertiary)' }}
            >
              {reason.length}/10 karakter minimum {isValid && '✓'}
            </p>
          </div>

          <DialogFooter className="mt-6 gap-3 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={cancelMutation.isPending}
            >
              Kembali
            </Button>
            <Button
              type="submit"
              variant="danger"
              loading={cancelMutation.isPending}
              disabled={!isValid}
            >
              Batalkan Janji Temu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Calendar View ───────────────────────────────────────────────────────────

interface CalendarViewProps {
  appointments: Appointment[]
  doctors: Doctor[]
  weekStart: Date
  onWeekChange: (direction: 'prev' | 'next') => void
}

function CalendarView({ appointments, doctors, weekStart, onWeekChange }: CalendarViewProps) {
  // Generate 7 days of the week
  const weekDays = useMemo(() => getDateRange(weekStart, 7), [weekStart])

  // Build doctor color map
  const doctorColorMap = useMemo(() => {
    const map = new Map<string, string>()
    doctors.forEach((doc, idx) => {
      map.set(doc.id, getDoctorColor(idx))
    })
    return map
  }, [doctors])

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    for (const appt of appointments) {
      const dateKey = appt.appointment_date?.split('T')[0] ?? ''
      if (!map.has(dateKey)) map.set(dateKey, [])
      map.get(dateKey)!.push(appt)
    }
    return map
  }, [appointments])

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => onWeekChange('prev')}>
          ← Minggu Sebelumnya
        </Button>
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {weekDays[0].toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} –{' '}
          {weekDays[6].toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <Button variant="ghost" size="sm" onClick={() => onWeekChange('next')}>
          Minggu Berikutnya →
        </Button>
      </div>

      {/* Doctor legend */}
      <div className="flex flex-wrap gap-3">
        {doctors.map((doc, idx) => (
          <div key={doc.id} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: getDoctorColor(idx) }}
            />
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              {doc.full_name}
            </span>
          </div>
        ))}
      </div>

      {/* Weekly grid */}
      <div
        className="grid grid-cols-7 gap-1 rounded-[var(--radius-lg)] overflow-hidden"
        style={{
          border: '1px solid var(--border-default)',
          backgroundColor: 'var(--surface-sunken)',
        }}
      >
        {/* Day headers */}
        {weekDays.map((day) => {
          const isToday = day.toDateString() === new Date().toDateString()
          return (
            <div
              key={day.toISOString()}
              className="text-center py-2"
              style={{
                backgroundColor: isToday
                  ? 'color-mix(in srgb, var(--accent-primary) 8%, transparent)'
                  : 'var(--surface-raised)',
                borderBottom: '1px solid var(--border-default)',
              }}
            >
              <p className="text-xs font-semibold" style={{ color: isToday ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                {DAY_NAMES[day.getDay()]}
              </p>
              <p className="text-sm font-bold" style={{ color: isToday ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                {day.getDate()}
              </p>
            </div>
          )
        })}

        {/* Day cells with appointments */}
        {weekDays.map((day) => {
          const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
          const dayAppointments = appointmentsByDate.get(dateKey) ?? []

          return (
            <div
              key={`cell-${day.toISOString()}`}
              className="min-h-[100px] p-1"
              style={{ backgroundColor: 'var(--surface-raised)' }}
            >
              {dayAppointments.slice(0, 4).map((appt) => (
                <div
                  key={appt.id}
                  className="mb-1 px-1.5 py-1 rounded-[var(--radius-sm)] text-[10px] leading-tight truncate"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${doctorColorMap.get(appt.doctor_id) ?? 'var(--accent-primary)'} 15%, transparent)`,
                    borderLeft: `3px solid ${doctorColorMap.get(appt.doctor_id) ?? 'var(--accent-primary)'}`,
                    color: 'var(--text-primary)',
                  }}
                  title={`${appt.patient?.user?.full_name ?? 'Pasien'} - ${formatTime(appt.schedule?.start_time)}`}
                >
                  <span className="font-semibold">{formatTime(appt.schedule?.start_time)}</span>{' '}
                  {appt.patient?.user?.full_name ?? appt.patient?.full_name ?? 'Pasien'}
                </div>
              ))}
              {dayAppointments.length > 4 && (
                <p className="text-[10px] text-center" style={{ color: 'var(--text-tertiary)' }}>
                  +{dayAppointments.length - 4} lainnya
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Page Component ─────────────────────────────────────────────────────

export default function AdminAppointmentsPage() {
  const queryClient = useQueryClient()
  const today = getTodayDateString()

  // View mode: list or calendar
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

  // Filters
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | ''>('')
  const [doctorFilter, setDoctorFilter] = useState('')
  const { value: searchValue, debouncedValue: debouncedSearch, setValue: setSearchValue } = useDebouncedSearch()

  // Pagination — server-side, max 15 items per page (Requirement 24.6: ≤50 DOM nodes)
  const [page, setPage] = useState(1)
  const perPage = 15

  // Calendar week state
  const [calendarWeekStart, setCalendarWeekStart] = useState(() => getWeekStart(new Date()))

  // Modal state
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)

  // Export state
  const [isExporting, setIsExporting] = useState(false)

  // ── Data Fetching ──

  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: [...queryKeys.appointments.lists(), { page, perPage, status: statusFilter, startDate, endDate }],
    queryFn: () => appointmentApi.getAll({
      page,
      per_page: perPage,
      status: statusFilter || undefined,
      date: startDate,
    }),
    staleTime: queryConfig.appointments.staleTime,
    gcTime: queryConfig.appointments.gcTime,
  })

  const allAppointments: Appointment[] = appointmentsData?.data?.data ?? []
  const totalPages = appointmentsData?.data?.meta?.total_pages ?? 1

  // Fetch doctors for filter dropdown and calendar legend
  const { data: doctorsData } = useQuery({
    queryKey: [...queryKeys.doctors.all, 'all-for-filter'],
    queryFn: () => doctorApi.getAll({ page: 1, per_page: 100 }),
    staleTime: queryConfig.doctors.staleTime,
    gcTime: queryConfig.doctors.gcTime,
  })

  const doctors: Doctor[] = doctorsData?.data?.data ?? []

  // Client-side filtering (doctor + search)
  const filteredAppointments = useMemo(() => {
    let result = allAppointments

    // Doctor filter
    if (doctorFilter) {
      result = result.filter((a) => a.doctor_id === doctorFilter)
    }

    // Search filter (patient name)
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase()
      result = result.filter((a) =>
        (a.patient?.user?.full_name ?? a.patient?.full_name ?? '').toLowerCase().includes(query) ||
        (a.doctor?.full_name ?? a.doctor?.user?.full_name ?? '').toLowerCase().includes(query)
      )
    }

    return result
  }, [allAppointments, doctorFilter, debouncedSearch])

  // ── Realtime Sync ──

  const handleRealtimeMessage = useCallback(
    (message: RealtimeMessage) => {
      if (message.type === 'appointment_status') {
        // Invalidate to refresh the list with updated status
        queryClient.invalidateQueries({ queryKey: queryKeys.appointments.lists() })
      }
    },
    [queryClient]
  )

  useRealtimeSync({
    channels: ['appointment_status'],
    onMessage: handleRealtimeMessage,
    refetchKeys: [[...queryKeys.appointments.lists()]],
  })

  // ── Handlers ──

  const handleFilterReset = () => {
    setStartDate(today)
    setEndDate(today)
    setStatusFilter('')
    setDoctorFilter('')
    setSearchValue('')
    setPage(1)
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as AppointmentStatus | '')
    setPage(1)
  }

  const handleDoctorChange = (value: string) => {
    setDoctorFilter(value)
    setPage(1)
  }

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') setStartDate(value)
    else setEndDate(value)
    setPage(1)
  }

  const handleReschedule = (appt: Appointment) => {
    setRescheduleTarget(appt)
    setRescheduleOpen(true)
  }

  const handleCancel = (appt: Appointment) => {
    setCancelTarget(appt)
    setCancelOpen(true)
  }

  const handleMutationSuccess = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.appointments.lists() })
  }

  const handleWeekChange = (direction: 'prev' | 'next') => {
    setCalendarWeekStart((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() + (direction === 'next' ? 7 : -7))
      return d
    })
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      await exportApi.downloadPDF({
        start_date: startDate,
        end_date: endDate,
        status: statusFilter || undefined,
      })
      toast.success('PDF berhasil diunduh')
    } catch {
      toast.error('Gagal mengekspor PDF')
    } finally {
      setIsExporting(false)
    }
  }

  // ── Table Columns ──

  const columns: Column<Appointment>[] = [
    {
      key: 'queue_number',
      label: '#',
      width: '60px',
      sortable: true,
      render: (row) => (
        <span
          className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold"
          style={{
            background: 'linear-gradient(135deg, var(--category-queue), var(--accent-primary))',
            color: 'var(--text-inverse)',
          }}
        >
          {row.queue_number}
        </span>
      ),
    },
    {
      key: 'patient',
      label: 'Pasien',
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {row.patient?.user?.full_name ?? row.patient?.full_name ?? '—'}
          </p>
        </div>
      ),
    },

    {
      key: 'doctor',
      label: 'Dokter',
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {row.doctor?.full_name ?? row.doctor?.user?.full_name ?? '—'}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {row.doctor?.specialization}
          </p>
        </div>
      ),
    },
    {
      key: 'appointment_date',
      label: 'Tanggal',
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
            {formatDate(row.appointment_date)}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {formatTime(row.schedule?.start_time)} – {formatTime(row.schedule?.end_time)}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge
          variant={statusVariant(row.status)}
          className="transition-colors duration-500"
        >
          {statusLabel(row.status)}
        </Badge>
      ),
    },

    {
      key: 'actions',
      label: 'Aksi',
      width: '140px',
      render: (row) => (
        <div className="flex items-center gap-1">
          {(row.status === 'waiting' || row.status === 'in_progress') && (
            <button
              onClick={(e) => { e.stopPropagation(); handleReschedule(row) }}
              className="p-2 rounded-[var(--radius-sm)] transition-colors hover:bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)]"
              aria-label={`Jadwalkan ulang ${row.patient?.user?.full_name ?? 'pasien'}`}
              title="Jadwalkan Ulang"
            >
              <RefreshCw className="size-4" style={{ color: 'var(--accent-primary)' }} />
            </button>
          )}
          {row.status === 'waiting' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleCancel(row) }}
              className="p-2 rounded-[var(--radius-sm)] transition-colors hover:bg-[color-mix(in_srgb,var(--accent-danger)_10%,transparent)]"
              aria-label={`Batalkan ${row.patient?.user?.full_name ?? 'pasien'}`}
              title="Batalkan"
            >
              <XCircle className="size-4" style={{ color: 'var(--accent-danger)' }} />
            </button>
          )}
        </div>
      ),
    },
  ]

  const hasActiveFilters = statusFilter || doctorFilter || startDate !== today || endDate !== today || debouncedSearch

  // ── Render ──

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Manajemen Janji Temu"
        subtitle="Pantau, jadwalkan ulang, dan kelola semua janji temu klinik"
        category="admin"
        actions={
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div
              className="flex rounded-[var(--radius-md)] overflow-hidden"
              style={{ border: '1px solid var(--border-default)' }}
              role="group"
              aria-label="Tampilan"
            >
              <button
                onClick={() => setViewMode('list')}
                className="px-3 py-2 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: viewMode === 'list' ? 'var(--accent-primary)' : 'var(--surface-raised)',
                  color: viewMode === 'list' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                }}
                aria-pressed={viewMode === 'list'}
                aria-label="Tampilan daftar"
              >
                <List className="size-4" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className="px-3 py-2 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: viewMode === 'calendar' ? 'var(--accent-primary)' : 'var(--surface-raised)',
                  color: viewMode === 'calendar' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                }}
                aria-pressed={viewMode === 'calendar'}
                aria-label="Tampilan kalender"
              >
                <CalendarDays className="size-4" />
              </button>
            </div>

            {/* Export button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportPDF}
              loading={isExporting}
              disabled={isLoading}
              leftIcon={<Download className="size-4" />}
            >
              Export PDF
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div
        className="flex flex-wrap items-end gap-3 p-4 rounded-[var(--radius-lg)]"
        style={{
          backgroundColor: 'var(--surface-raised)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div className="flex items-center gap-2 mr-2">
          <Filter className="size-4" style={{ color: 'var(--text-tertiary)' }} aria-hidden="true" />
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Filter:
          </span>
        </div>

        {/* Date range - start */}
        <div className="space-y-1">
          <label htmlFor="filter-start-date" className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            Dari
          </label>
          <Input
            id="filter-start-date"
            type="date"
            value={startDate}
            onChange={(e) => handleDateChange('start', e.target.value)}
            className="h-9 w-[150px] text-sm"
          />
        </div>

        {/* Date range - end */}
        <div className="space-y-1">
          <label htmlFor="filter-end-date" className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            Sampai
          </label>
          <Input
            id="filter-end-date"
            type="date"
            value={endDate}
            onChange={(e) => handleDateChange('end', e.target.value)}
            className="h-9 w-[150px] text-sm"
          />
        </div>

        {/* Doctor filter */}
        <div className="space-y-1">
          <label htmlFor="filter-doctor" className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            Dokter
          </label>
          <select
            id="filter-doctor"
            value={doctorFilter}
            onChange={(e) => handleDoctorChange(e.target.value)}
            className="h-9 px-3 text-sm rounded-[var(--radius-md)] border-2 border-[color-mix(in_srgb,var(--text-primary)_15%,transparent)] bg-[var(--surface-raised)] text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2"
            aria-label="Filter dokter"
          >
            <option value="">Semua Dokter</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.full_name}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="space-y-1">
          <label htmlFor="filter-status" className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            Status
          </label>
          <select
            id="filter-status"
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="h-9 px-3 text-sm rounded-[var(--radius-md)] border-2 border-[color-mix(in_srgb,var(--text-primary)_15%,transparent)] bg-[var(--surface-raised)] text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2"
            aria-label="Filter status"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Reset filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleFilterReset} className="self-end">
            Reset Filter
          </Button>
        )}
      </div>

      {/* Content: List or Calendar view */}
      {viewMode === 'list' ? (
        <DataTable<Appointment>
          columns={columns}
          data={filteredAppointments}
          loading={isLoading}
          pagination={{
            page,
            totalPages,
            onPageChange: setPage,
          }}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Cari pasien atau dokter..."
          emptyState={
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="size-12 mb-4 opacity-20" style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Tidak ada janji temu ditemukan
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {hasActiveFilters
                  ? 'Coba ubah filter atau rentang tanggal.'
                  : 'Belum ada janji temu untuk hari ini.'}
              </p>
            </div>
          }
        />
      ) : (
        <div
          className="rounded-[var(--radius-lg)] p-4"
          style={{
            backgroundColor: 'var(--surface-raised)',
            border: '1px solid var(--border-default)',
          }}
        >
          <CalendarView
            appointments={filteredAppointments}
            doctors={doctors}
            weekStart={calendarWeekStart}
            onWeekChange={handleWeekChange}
          />
        </div>
      )}

      {/* Reschedule Modal */}
      <RescheduleModal
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        appointment={rescheduleTarget}
        onSuccess={handleMutationSuccess}
      />

      {/* Cancel Modal */}
      <CancelModal
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        appointment={cancelTarget}
        onSuccess={handleMutationSuccess}
      />
    </div>
  )
}
