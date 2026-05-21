import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Loader2, Search, Calendar, Clock, AlertCircle } from 'lucide-react'
import { doctorApi, scheduleApi } from '@/api/doctors'
import { toast } from '@/hooks/use-toast'
import { useDebouncedSearch } from '@/hooks/use-debounced-search'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog'
import { DAYS } from '@/lib/utils'
import { queryKeys, queryConfig } from '@/lib/query-keys'
import { scheduleEntrySchema } from '@/lib/validations/schemas'
import type { Doctor, DoctorSchedule } from '@/types'

// ── Types ──────────────────────────────────────────────────────────────────

interface ScheduleFormData {
  dayOfWeek: number
  startTime: string
  endTime: string
  slotDuration: number
  maxPatients: number
}

interface ConflictError {
  message: string
  conflictingEntry: DoctorSchedule
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Parse "HH:MM" to minutes since midnight */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** Check if two time ranges overlap */
function timesOverlap(
  start1: string, end1: string,
  start2: string, end2: string
): boolean {
  const s1 = timeToMinutes(start1)
  const e1 = timeToMinutes(end1)
  const s2 = timeToMinutes(start2)
  const e2 = timeToMinutes(end2)
  return s1 < e2 && s2 < e1
}

/** Generate bookable slot times from a schedule entry */
function generateSlots(startTime: string, endTime: string, slotDuration: number): string[] {
  const slots: string[] = []
  let current = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  while (current + slotDuration <= end) {
    const h = Math.floor(current / 60)
    const m = current % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    current += slotDuration
  }
  return slots
}

/** Get the next 7 days starting from today */
function getNext7Days(): { date: Date; dayOfWeek: number; label: string }[] {
  const days: { date: Date; dayOfWeek: number; label: string }[] = []
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push({
      date: d,
      dayOfWeek: d.getDay(),
      label: d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }),
    })
  }
  return days
}

// ── Schedule Entry Modal ───────────────────────────────────────────────────

interface ScheduleModalProps {
  schedule?: DoctorSchedule | null
  doctorId: string
  existingSchedules: DoctorSchedule[]
  onClose: () => void
  onSaved: () => void
}

function ScheduleModal({ schedule, doctorId, existingSchedules, onClose, onSaved }: ScheduleModalProps) {
  const [form, setForm] = useState<ScheduleFormData>({
    dayOfWeek: schedule?.day_of_week ?? 1,
    startTime: schedule?.start_time ?? '08:00',
    endTime: schedule?.end_time ?? '12:00',
    slotDuration: 30,
    maxPatients: schedule?.max_patient ?? 20,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [conflictError, setConflictError] = useState<ConflictError | null>(null)
  const [apiError, setApiError] = useState('')

  const createMutation = useMutation({
    mutationFn: scheduleApi.create,
    onSuccess: () => {
      toast.success('Jadwal berhasil ditambahkan')
      onSaved()
      onClose()
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      setApiError(e?.response?.data?.message || 'Gagal menyimpan jadwal')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DoctorSchedule> }) =>
      scheduleApi.update(id, data),
    onSuccess: () => {
      toast.success('Jadwal berhasil diperbarui')
      onSaved()
      onClose()
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      setApiError(e?.response?.data?.message || 'Gagal memperbarui jadwal')
    },
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  /** Validate form using scheduleEntrySchema + conflict detection */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    setConflictError(null)

    // Validate with zod schema
    const result = scheduleEntrySchema.safeParse({
      startTime: form.startTime,
      endTime: form.endTime,
      slotDuration: form.slotDuration,
      maxPatients: form.maxPatients,
    })

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string
        newErrors[field] = issue.message
      })
      setErrors(newErrors)
      return false
    }

    // Conflict detection: same doctor, same weekday, overlapping times
    const conflicting = existingSchedules.find((s) => {
      if (schedule && s.id === schedule.id) return false // skip self when editing
      return (
        s.day_of_week === form.dayOfWeek &&
        timesOverlap(form.startTime, form.endTime, s.start_time, s.end_time)
      )
    })

    if (conflicting) {
      setConflictError({
        message: `Konflik dengan jadwal ${DAYS[conflicting.day_of_week]} ${conflicting.start_time}–${conflicting.end_time}`,
        conflictingEntry: conflicting,
      })
      setErrors(newErrors)
      return false
    }

    setErrors(newErrors)
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setApiError('')
    if (!validate()) return

    if (schedule) {
      updateMutation.mutate({
        id: schedule.id,
        data: {
          day_of_week: form.dayOfWeek,
          start_time: form.startTime,
          end_time: form.endTime,
          max_patient: form.maxPatients,
        },
      })
    } else {
      createMutation.mutate({
        doctor_id: doctorId,
        day_of_week: form.dayOfWeek,
        start_time: form.startTime,
        end_time: form.endTime,
        max_patient: form.maxPatients,
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 modal-overlay">
      <div
        className="w-full max-w-md rounded-[var(--radius-xl)] shadow-xl modal-content"
        style={{ backgroundColor: 'var(--surface-primary, #fff)' }}
      >
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border-default, #e8e2da)' }}
        >
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {schedule ? 'Edit Jadwal' : 'Tambah Jadwal'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {apiError && (
            <div className="p-3 rounded-lg text-sm" style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-danger) 8%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent-danger) 20%, transparent)',
              color: 'var(--accent-danger)',
            }}>
              {apiError}
            </div>
          )}

          {conflictError && (
            <div className="p-3 rounded-lg text-sm flex items-start gap-2" role="alert" style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-warning) 8%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent-warning) 20%, transparent)',
              color: 'var(--accent-warning)',
            }}>
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              <span>{conflictError.message}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Hari *
            </label>
            <select
              className="flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-primary)' }}
              value={form.dayOfWeek}
              onChange={e => setForm({ ...form, dayOfWeek: Number(e.target.value) })}
            >
              {DAYS.map((day, idx) => (
                <option key={idx} value={idx}>{day}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Jam Mulai *
              </label>
              <Input
                type="time"
                value={form.startTime}
                onChange={e => setForm({ ...form, startTime: e.target.value })}
                required
                aria-invalid={!!errors.startTime}
                aria-describedby={errors.startTime ? 'err-startTime' : undefined}
              />
              {errors.startTime && (
                <p id="err-startTime" className="text-xs" style={{ color: 'var(--accent-danger)' }}>
                  {errors.startTime}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Jam Selesai *
              </label>
              <Input
                type="time"
                value={form.endTime}
                onChange={e => setForm({ ...form, endTime: e.target.value })}
                required
                aria-invalid={!!errors.endTime}
                aria-describedby={errors.endTime ? 'err-endTime' : undefined}
              />
              {errors.endTime && (
                <p id="err-endTime" className="text-xs" style={{ color: 'var(--accent-danger)' }}>
                  {errors.endTime}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Durasi Slot (menit) *
              </label>
              <Input
                type="number"
                min={5}
                max={120}
                value={form.slotDuration}
                onChange={e => setForm({ ...form, slotDuration: Number(e.target.value) })}
                required
                aria-invalid={!!errors.slotDuration}
                aria-describedby={errors.slotDuration ? 'err-slotDuration' : undefined}
              />
              {errors.slotDuration && (
                <p id="err-slotDuration" className="text-xs" style={{ color: 'var(--accent-danger)' }}>
                  {errors.slotDuration}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Maks. Pasien/Slot *
              </label>
              <Input
                type="number"
                min={1}
                max={50}
                value={form.maxPatients}
                onChange={e => setForm({ ...form, maxPatients: Number(e.target.value) })}
                required
                aria-invalid={!!errors.maxPatients}
                aria-describedby={errors.maxPatients ? 'err-maxPatients' : undefined}
              />
              {errors.maxPatients && (
                <p id="err-maxPatients" className="text-xs" style={{ color: 'var(--accent-danger)' }}>
                  {errors.maxPatients}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Batal
            </Button>
            <Button
              type="submit"
              className="gradient-primary text-white border-0 rounded-xl shadow-md shadow-blue-500/20"
              disabled={isPending}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : 'Simpan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Weekly Grid Component ──────────────────────────────────────────────────

interface WeeklyGridProps {
  schedules: DoctorSchedule[]
  onEdit: (schedule: DoctorSchedule) => void
  onDelete: (schedule: DoctorSchedule) => void
}

function WeeklyGrid({ schedules, onEdit, onDelete }: WeeklyGridProps) {
  // Group schedules by day of week
  const byDay = useMemo(() => {
    const map: Record<number, DoctorSchedule[]> = {}
    for (let i = 0; i < 7; i++) map[i] = []
    schedules.forEach((s) => {
      if (map[s.day_of_week]) {
        map[s.day_of_week].push(s)
      }
    })
    // Sort each day's entries by start time
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.start_time.localeCompare(b.start_time)))
    return map
  }, [schedules])

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
      {DAYS.map((dayName, dayIdx) => (
        <div
          key={dayIdx}
          className="rounded-[var(--radius-md)] p-3"
          style={{
            backgroundColor: 'var(--surface-sunken, #f5f0eb)',
            border: '1px solid var(--border-default, #e8e2da)',
          }}
        >
          <h4
            className="text-xs font-semibold mb-2 text-center"
            style={{ color: 'var(--text-secondary)' }}
          >
            {dayName}
          </h4>
          {byDay[dayIdx].length === 0 ? (
            <p className="text-[10px] text-center" style={{ color: 'var(--text-tertiary)' }}>
              Tidak ada jadwal
            </p>
          ) : (
            <div className="space-y-1.5">
              {byDay[dayIdx].map((s) => (
                <div
                  key={s.id}
                  className="rounded-[var(--radius-sm)] p-2 group relative"
                  style={{
                    backgroundColor: 'var(--surface-primary, #fff)',
                    border: '1px solid var(--border-default, #e8e2da)',
                  }}
                >
                  <p className="text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>
                    {s.start_time} – {s.end_time}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                    Maks {s.max_patient} pasien
                  </p>
                  <Badge
                    variant={s.is_active ? 'default' : 'secondary'}
                    className="text-[9px] mt-1"
                  >
                    {s.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>

                  {/* Action buttons on hover */}
                  <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
                    <button
                      onClick={() => onEdit(s)}
                      className="p-1 rounded transition-colors"
                      style={{ color: 'var(--text-tertiary)' }}
                      aria-label={`Edit jadwal ${dayName} ${s.start_time}`}
                    >
                      <Pencil className="size-3" />
                    </button>
                    <button
                      onClick={() => onDelete(s)}
                      className="p-1 rounded transition-colors"
                      style={{ color: 'var(--accent-danger)' }}
                      aria-label={`Hapus jadwal ${dayName} ${s.start_time}`}
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── 7-Day Preview Component ────────────────────────────────────────────────

interface SlotPreviewProps {
  schedules: DoctorSchedule[]
}

function SlotPreview({ schedules }: SlotPreviewProps) {
  const next7Days = useMemo(() => getNext7Days(), [])

  const slotsByDay = useMemo(() => {
    return next7Days.map((day) => {
      const daySchedules = schedules.filter(
        (s) => s.day_of_week === day.dayOfWeek && s.is_active
      )
      const slots: string[] = []
      daySchedules.forEach((s) => {
        // Use max_patient as a proxy for slot duration if not stored
        // Default to 30 min slots for preview
        const duration = Math.max(
          5,
          Math.min(120, Math.floor(
            (timeToMinutes(s.end_time) - timeToMinutes(s.start_time)) / Math.max(s.max_patient, 1)
          ))
        )
        slots.push(...generateSlots(s.start_time, s.end_time, duration))
      })
      return { ...day, slots }
    })
  }, [next7Days, schedules])

  return (
    <Card surface="raised">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="size-4" style={{ color: 'var(--category-admin)' }} />
          Preview 7 Hari ke Depan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {slotsByDay.map((day, idx) => (
            <div
              key={idx}
              className="rounded-[var(--radius-md)] p-3"
              style={{
                backgroundColor: 'var(--surface-sunken, #f5f0eb)',
                border: '1px solid var(--border-default, #e8e2da)',
              }}
            >
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {day.label}
              </p>
              {day.slots.length === 0 ? (
                <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                  Tidak tersedia
                </p>
              ) : (
                <div className="space-y-0.5 max-h-32 overflow-y-auto">
                  {day.slots.map((slot, sIdx) => (
                    <div
                      key={sIdx}
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--category-admin) 10%, transparent)',
                        color: 'var(--category-admin)',
                      }}
                    >
                      {slot}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10px] mt-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                {day.slots.length} slot
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Searchable Doctor Dropdown ─────────────────────────────────────────────

interface DoctorDropdownProps {
  doctors: Doctor[]
  selectedId: string
  onSelect: (id: string) => void
  loading?: boolean
}

function DoctorDropdown({ doctors, selectedId, onSelect, loading }: DoctorDropdownProps) {
  const { value: searchValue, debouncedValue, setValue: setSearchValue } = useDebouncedSearch()
  const [isOpen, setIsOpen] = useState(false)

  const filteredDoctors = useMemo(() => {
    if (!debouncedValue) return doctors
    const lower = debouncedValue.toLowerCase()
    return doctors.filter(
      (d) =>
        d.full_name.toLowerCase().includes(lower) ||
        d.specialization.toLowerCase().includes(lower)
    )
  }, [doctors, debouncedValue])

  const selectedDoctor = doctors.find((d) => d.id === selectedId)

  return (
    <div className="relative">
      <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--text-primary)' }}>
        Pilih Dokter
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm"
        style={{
          borderColor: 'var(--border-default)',
          backgroundColor: 'var(--surface-primary)',
          color: selectedDoctor ? 'var(--text-primary)' : 'var(--text-tertiary)',
        }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="truncate">
          {loading ? 'Memuat...' : selectedDoctor
            ? `${selectedDoctor.full_name} — ${selectedDoctor.specialization}`
            : 'Pilih dokter...'}
        </span>
        <Search className="size-4 shrink-0 ml-2" style={{ color: 'var(--text-tertiary)' }} />
      </button>

      {isOpen && (
        <div
          className="absolute z-10 mt-1 w-full rounded-[var(--radius-md)] shadow-lg overflow-hidden"
          style={{
            backgroundColor: 'var(--surface-primary)',
            border: '1px solid var(--border-default)',
          }}
          role="listbox"
        >
          <div className="p-2" style={{ borderBottom: '1px solid var(--border-default)' }}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5" style={{ color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Cari dokter..."
                className="w-full h-8 pl-8 pr-3 text-sm rounded border-0 outline-none"
                style={{ backgroundColor: 'var(--surface-sunken)', color: 'var(--text-primary)' }}
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredDoctors.length === 0 ? (
              <p className="px-3 py-4 text-sm text-center" style={{ color: 'var(--text-tertiary)' }}>
                Tidak ditemukan
              </p>
            ) : (
              filteredDoctors.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  role="option"
                  aria-selected={doc.id === selectedId}
                  onClick={() => { onSelect(doc.id); setIsOpen(false); setSearchValue('') }}
                  className="w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center gap-2"
                  style={{
                    backgroundColor: doc.id === selectedId
                      ? 'color-mix(in srgb, var(--category-admin) 10%, transparent)'
                      : 'transparent',
                    color: 'var(--text-primary)',
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, var(--category-doctor), var(--accent-primary))',
                      color: 'var(--text-inverse)',
                    }}
                  >
                    {doc.full_name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{doc.full_name}</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                      {doc.specialization}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page Component ────────────────────────────────────────────────────

export default function AdminSchedulesPage() {
  const queryClient = useQueryClient()
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editSchedule, setEditSchedule] = useState<DoctorSchedule | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DoctorSchedule | null>(null)

  // Fetch all active doctors
  const { data: doctorsData, isLoading: doctorsLoading } = useQuery({
    queryKey: queryKeys.doctors.lists(),
    queryFn: () => doctorApi.getAll({ per_page: 100 }),
    staleTime: queryConfig.doctors.staleTime,
    gcTime: queryConfig.doctors.gcTime,
  })
  const doctors = doctorsData?.data?.data ?? []

  // Fetch schedules for selected doctor
  const {
    data: schedulesData,
    isLoading: schedulesLoading,
    isError: schedulesError,
    refetch: refetchSchedules,
  } = useQuery({
    queryKey: queryKeys.schedules.byDoctor(selectedDoctorId),
    queryFn: () => scheduleApi.getByDoctor(selectedDoctorId),
    enabled: !!selectedDoctorId,
    staleTime: queryConfig.schedules.staleTime,
    gcTime: queryConfig.schedules.gcTime,
  })
  const schedules: DoctorSchedule[] = schedulesData?.data?.data ?? []

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: scheduleApi.delete,
    onSuccess: () => {
      toast.success('Jadwal berhasil dihapus')
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules.byDoctor(selectedDoctorId) })
      setDeleteTarget(null)
    },
    onError: () => {
      toast.error('Gagal menghapus jadwal')
      setDeleteTarget(null)
    },
  })

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.schedules.byDoctor(selectedDoctorId) })
  }

  const handleEdit = (schedule: DoctorSchedule) => {
    setEditSchedule(schedule)
    setShowModal(true)
  }

  const handleDelete = (schedule: DoctorSchedule) => {
    setDeleteTarget(schedule)
  }

  const handleAddNew = () => {
    setEditSchedule(null)
    setShowModal(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jadwal Praktek"
        subtitle="Kelola jadwal praktek dokter dan kapasitas slot"
        category="admin"
        actions={
          selectedDoctorId ? (
            <Button
              onClick={handleAddNew}
              className="gradient-primary text-white border-0 rounded-xl shadow-lg shadow-blue-500/25 font-semibold"
            >
              <Plus className="size-4 mr-1" /> Tambah Jadwal
            </Button>
          ) : undefined
        }
      />

      {/* Doctor Selection */}
      <Card surface="raised">
        <CardContent className="py-4">
          <DoctorDropdown
            doctors={doctors}
            selectedId={selectedDoctorId}
            onSelect={setSelectedDoctorId}
            loading={doctorsLoading}
          />
        </CardContent>
      </Card>

      {/* Content area — depends on doctor selection */}
      {!selectedDoctorId ? (
        <EmptyState
          icon={Calendar}
          title="Pilih Dokter"
          description="Pilih dokter dari dropdown di atas untuk melihat dan mengelola jadwal prakteknya."
        />
      ) : schedulesLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
        </div>
      ) : schedulesError ? (
        <ErrorState
          message="Gagal memuat jadwal dokter. Silakan coba lagi."
          category="server"
          onRetry={() => refetchSchedules()}
        />
      ) : (
        <div className="space-y-6">
          {/* Weekly Grid */}
          <Card surface="raised">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="size-4" style={{ color: 'var(--category-admin)' }} />
                Jadwal Mingguan
                {schedules.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] ml-1">
                    {schedules.length} entri
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="Belum Ada Jadwal"
                  description="Dokter ini belum memiliki jadwal praktek. Tambahkan jadwal baru."
                  action={{ label: 'Tambah Jadwal', onClick: handleAddNew }}
                />
              ) : (
                <WeeklyGrid
                  schedules={schedules}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}
            </CardContent>
          </Card>

          {/* 7-Day Slot Preview */}
          {schedules.length > 0 && <SlotPreview schedules={schedules} />}
        </div>
      )}

      {/* Schedule Modal */}
      {showModal && selectedDoctorId && (
        <ScheduleModal
          schedule={editSchedule}
          doctorId={selectedDoctorId}
          existingSchedules={schedules}
          onClose={() => { setShowModal(false); setEditSchedule(null) }}
          onSaved={handleSaved}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Hapus Jadwal"
        message={
          deleteTarget
            ? `Apakah Anda yakin ingin menghapus jadwal ${DAYS[deleteTarget.day_of_week]} ${deleteTarget.start_time}–${deleteTarget.end_time}? Tindakan ini tidak dapat dibatalkan.`
            : ''
        }
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id) }}
        loading={deleteMutation.isPending}
        destructive
      />
    </div>
  )
}
