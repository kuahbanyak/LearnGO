import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Calendar,
  Clock,
  CheckCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  User as UserIcon,
  Stethoscope,
  CalendarDays,
  ClipboardCheck,
} from 'lucide-react'
import { doctorApi, scheduleApi } from '@/api/doctors'
import { appointmentApi } from '@/api/appointments'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'
import { queryKeys, STALE_TIME_STATIC, GC_TIME_STATIC } from '@/lib/query-keys'
import { PageHeader } from '@/components/shared/page-header'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { StarRatingDisplay } from '@/components/shared/star-rating'
import SymptomScreeningForm from '@/components/shared/symptom-screening-form'
import type { Doctor, DoctorSchedule } from '@/types'

// ── Types ──

interface WizardState {
  selectedDoctor: Doctor | null
  selectedSchedule: DoctorSchedule | null
  selectedDate: string
  symptomData: SymptomFormData | null
}

interface SymptomFormData {
  chief_complaint: string
  severity: 'mild' | 'moderate' | 'severe'
  notes?: string
}

interface CalendarDay {
  date: Date
  dateStr: string
  dayOfMonth: number
  isToday: boolean
  isSelected: boolean
  isDisabled: boolean
  slotCount: number
}

// ── Step Indicator Component ──

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { number: 1, label: 'Pilih Dokter', icon: Stethoscope },
    { number: 2, label: 'Pilih Jadwal', icon: CalendarDays },
    { number: 3, label: 'Konfirmasi', icon: ClipboardCheck },
  ]

  return (
    <nav aria-label="Langkah booking" className="flex items-center justify-between">
      {steps.map((step, idx) => {
        const Icon = step.icon
        const isActive = currentStep === step.number
        const isCompleted = currentStep > step.number

        return (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className="flex items-center justify-center rounded-full transition-all"
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  backgroundColor: isCompleted
                    ? 'var(--accent-success, #059669)'
                    : isActive
                      ? 'var(--category-patient, #059669)'
                      : 'var(--surface-sunken, #f5f0eb)',
                  color: isCompleted || isActive
                    ? 'var(--text-inverse, #ffffff)'
                    : 'var(--text-tertiary, #6b6358)',
                  boxShadow: isActive ? 'var(--shadow-glow)' : undefined,
                }}
                aria-current={isActive ? 'step' : undefined}
              >
                {isCompleted ? (
                  <CheckCircle className="size-5" />
                ) : (
                  <Icon className="size-5" />
                )}
              </div>
              <span
                className="text-xs font-medium text-center hidden sm:block"
                style={{
                  color: isActive
                    ? 'var(--text-primary, #1a1714)'
                    : 'var(--text-tertiary, #6b6358)',
                }}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className="h-0.5 flex-1 mx-2 rounded-full hidden sm:block"
                style={{
                  backgroundColor: currentStep > step.number
                    ? 'var(--accent-success, #059669)'
                    : 'var(--border-default, #e8e2da)',
                }}
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}

// ── Helper: generate next 30 days calendar ──

function generateCalendarDays(
  selectedDate: string,
  availableDays: number[],
  schedulesForDay: Map<number, DoctorSchedule[]>
): CalendarDay[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days: CalendarDay[] = []

  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const dayOfWeek = date.getDay()
    const dateStr = formatDateStr(date)
    const isAvailable = availableDays.includes(dayOfWeek)
    const schedules = schedulesForDay.get(dayOfWeek) ?? []
    const slotCount = schedules.reduce((sum, s) => sum + s.max_patient, 0)

    days.push({
      date,
      dateStr,
      dayOfMonth: date.getDate(),
      isToday: i === 0,
      isSelected: dateStr === selectedDate,
      isDisabled: !isAvailable,
      slotCount: isAvailable ? slotCount : 0,
    })
  }

  return days
}

function formatDateStr(date: Date): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// ── Main Component ──

export default function BookAppointmentPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Wizard state
  const [step, setStep] = useState(1)
  const [wizardState, setWizardState] = useState<WizardState>({
    selectedDoctor: null,
    selectedSchedule: null,
    selectedDate: '',
    symptomData: null,
  })
  const [specialtyFilter, setSpecialtyFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [slotError, setSlotError] = useState(false)
  const [success, setSuccess] = useState(false)
  const [bookingResult, setBookingResult] = useState<{ queueNumber?: number } | null>(null)

  // ── Data Fetching ──

  const { data: doctorsData, isLoading: doctorsLoading } = useQuery({
    queryKey: queryKeys.doctors.lists(),
    queryFn: () => doctorApi.getAll({ per_page: 100 }),
    staleTime: STALE_TIME_STATIC,
    gcTime: GC_TIME_STATIC,
  })

  const { data: schedulesData, isLoading: schedulesLoading, refetch: refetchSchedules } = useQuery({
    queryKey: queryKeys.schedules.byDoctor(wizardState.selectedDoctor?.id ?? ''),
    queryFn: () => scheduleApi.getByDoctor(wizardState.selectedDoctor!.id),
    enabled: !!wizardState.selectedDoctor,
    staleTime: STALE_TIME_STATIC,
    gcTime: GC_TIME_STATIC,
  })

  const doctors: Doctor[] = doctorsData?.data?.data ?? []
  const schedules: DoctorSchedule[] = schedulesData?.data?.data ?? []
  const activeSchedules = schedules.filter(s => s.is_active)

  // ── Derived Data ──

  const specialties = useMemo(() => {
    const set = new Set(doctors.map(d => d.specialization).filter(Boolean))
    return Array.from(set).sort()
  }, [doctors])

  const filteredDoctors = useMemo(() => {
    let result = doctors
    if (specialtyFilter) {
      result = result.filter(d => d.specialization === specialtyFilter)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(d =>
        (d.user?.full_name ?? d.full_name ?? '').toLowerCase().includes(q) ||
        d.specialization.toLowerCase().includes(q)
      )
    }
    return result
  }, [doctors, specialtyFilter, searchQuery])

  const schedulesForDay = useMemo(() => {
    const map = new Map<number, DoctorSchedule[]>()
    for (const s of activeSchedules) {
      const existing = map.get(s.day_of_week) ?? []
      existing.push(s)
      map.set(s.day_of_week, existing)
    }
    return map
  }, [activeSchedules])

  const availableDays = useMemo(() => {
    return Array.from(schedulesForDay.keys())
  }, [schedulesForDay])

  const calendarDays = useMemo(() => {
    return generateCalendarDays(wizardState.selectedDate, availableDays, schedulesForDay)
  }, [wizardState.selectedDate, availableDays, schedulesForDay])

  const selectedDaySchedules = useMemo(() => {
    if (!wizardState.selectedDate) return []
    const date = new Date(wizardState.selectedDate)
    const dayOfWeek = date.getDay()
    return schedulesForDay.get(dayOfWeek) ?? []
  }, [wizardState.selectedDate, schedulesForDay])

  // ── Booking Mutation ──

  const bookMutation = useMutation({
    mutationFn: appointmentApi.book,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.my() })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.patient() })
      const data = response?.data?.data
      setBookingResult({ queueNumber: data?.queue_number })
      setSuccess(true)
      toast.success('Booking Berhasil!', 'Antrian Anda telah terdaftar.')
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string; code?: string } }; status?: number }
      const msg = e?.response?.data?.message || 'Gagal membooking antrian'
      const status = (err as { response?: { status?: number } })?.response?.status

      // Handle concurrent slot booking error (409 Conflict or slot-taken message)
      if (status === 409 || msg.toLowerCase().includes('slot') || msg.toLowerCase().includes('penuh')) {
        setSlotError(true)
        refetchSchedules()
      } else {
        toast.error('Gagal mendaftar antrian', msg)
      }
    },
  })

  // ── Handlers ──

  const handleSelectDoctor = useCallback((doctor: Doctor) => {
    setWizardState(prev => ({
      ...prev,
      selectedDoctor: doctor,
      selectedSchedule: null,
      selectedDate: '',
    }))
    setStep(2)
    setSlotError(false)
  }, [])

  const handleSelectDate = useCallback((dateStr: string) => {
    setWizardState(prev => ({
      ...prev,
      selectedDate: dateStr,
      selectedSchedule: null,
    }))
  }, [])

  const handleSelectSlot = useCallback((schedule: DoctorSchedule) => {
    setWizardState(prev => ({
      ...prev,
      selectedSchedule: schedule,
    }))
    setStep(3)
  }, [])

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep(step - 1)
      setSlotError(false)
    }
  }, [step])

  const handleCancel = useCallback(() => {
    setWizardState({
      selectedDoctor: null,
      selectedSchedule: null,
      selectedDate: '',
      symptomData: null,
    })
    setStep(1)
    setSpecialtyFilter('')
    setSearchQuery('')
    setSlotError(false)
  }, [])

  const handleSubmit = useCallback(() => {
    if (!wizardState.selectedDoctor || !wizardState.selectedSchedule || !wizardState.selectedDate) return
    setSlotError(false)
    bookMutation.mutate({
      doctor_id: wizardState.selectedDoctor.id,
      schedule_id: wizardState.selectedSchedule.id,
      appointment_date: wizardState.selectedDate,
    })
  }, [wizardState, bookMutation])

  const handleSlotErrorRetry = useCallback(() => {
    setSlotError(false)
    refetchSchedules()
    setStep(2)
  }, [refetchSchedules])

  // ── Profile completeness check ──

  const isProfileComplete = user?.nik && user?.phone && user?.full_name && user?.gender && user?.address && user?.blood_type

  if (!isProfileComplete) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Daftar Antrian"
          subtitle="Buat janji temu dengan dokter"
          category="patient"
        />
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          style={{ gap: 'var(--space-4, 1rem)' }}
        >
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: '5rem',
              height: '5rem',
              backgroundColor: 'color-mix(in srgb, var(--accent-warning) 12%, transparent)',
            }}
          >
            <Calendar size={48} style={{ color: 'var(--accent-warning, #d97706)' }} />
          </div>
          <h2
            className="text-xl font-semibold"
            style={{ color: 'var(--text-primary, #1a1714)' }}
          >
            Profil Belum Lengkap
          </h2>
          <p
            className="text-sm max-w-sm"
            style={{ color: 'var(--text-secondary, #3d3830)' }}
          >
            Lengkapi profil Anda (NIK, No HP, Jenis Kelamin, Alamat, Golongan Darah) sebelum membuat janji temu.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/patient/settings')}
            style={{ marginTop: 'var(--space-4, 1rem)' }}
          >
            Lengkapi Profil
          </Button>
        </div>
      </div>
    )
  }

  // ── Success State ──

  if (success) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Daftar Antrian"
          subtitle="Buat janji temu dengan dokter"
          category="patient"
        />
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          style={{ gap: 'var(--space-4, 1rem)' }}
        >
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: '5rem',
              height: '5rem',
              backgroundColor: 'color-mix(in srgb, var(--accent-success) 12%, transparent)',
            }}
          >
            <CheckCircle size={48} style={{ color: 'var(--accent-success, #059669)' }} />
          </div>
          <h2
            className="text-xl font-semibold"
            style={{ color: 'var(--text-primary, #1a1714)' }}
          >
            Booking Berhasil!
          </h2>
          <p
            className="text-sm"
            style={{ color: 'var(--text-secondary, #3d3830)' }}
          >
            Antrian Anda telah terdaftar.
            {bookingResult?.queueNumber && (
              <span className="block mt-1 font-mono text-lg font-bold" style={{ color: 'var(--category-patient)' }}>
                No. Antrian: {bookingResult.queueNumber}
              </span>
            )}
          </p>
          <div className="flex gap-3 mt-4">
            <Button
              variant="primary"
              onClick={() => navigate('/patient/my-queue')}
            >
              Lihat Antrian
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/patient/dashboard')}
            >
              Ke Beranda
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main Wizard Render ──

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Daftar Antrian"
        subtitle="Buat janji temu dengan dokter"
        category="patient"
        actions={
          step > 1 ? (
            <Button variant="ghost" size="sm" onClick={handleCancel} leftIcon={<X className="size-4" />}>
              Batal
            </Button>
          ) : undefined
        }
      />

      {/* Step Indicator */}
      <StepIndicator currentStep={step} />

      {/* ── Step 1: Select Doctor ── */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4"
                style={{ color: 'var(--text-tertiary, #6b6358)' }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari dokter..."
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-[var(--radius-md,0.75rem)] border transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                style={{
                  backgroundColor: 'var(--surface-raised, #ffffff)',
                  borderColor: 'color-mix(in srgb, var(--text-primary) 15%, transparent)',
                  color: 'var(--text-primary, #1a1714)',
                }}
              />
            </div>
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="px-4 py-2.5 text-sm rounded-[var(--radius-md,0.75rem)] border transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              style={{
                backgroundColor: 'var(--surface-raised, #ffffff)',
                borderColor: 'color-mix(in srgb, var(--text-primary) 15%, transparent)',
                color: 'var(--text-primary, #1a1714)',
              }}
              aria-label="Filter spesialisasi"
            >
              <option value="">Semua Spesialisasi</option>
              {specialties.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Doctor Cards */}
          {doctorsLoading ? (
            <LoadingSkeleton variant="card" count={3} />
          ) : filteredDoctors.length === 0 ? (
            <div
              className="text-center py-8"
              style={{ color: 'var(--text-tertiary, #6b6358)' }}
            >
              <p className="text-sm">Tidak ada dokter ditemukan</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredDoctors.map((doctor) => {
                const doctorName = doctor.user?.full_name ?? doctor.full_name ?? 'Dokter'
                return (
                  <button
                    key={doctor.id}
                    onClick={() => handleSelectDoctor(doctor)}
                    className="w-full flex items-center gap-4 p-4 rounded-[var(--radius-lg,1rem)] border text-left transition-all hover:shadow-[var(--shadow-md)]"
                    style={{
                      backgroundColor: 'var(--surface-raised, #ffffff)',
                      borderColor: 'var(--border-default, #e8e2da)',
                    }}
                    aria-label={`Pilih ${doctorName}, ${doctor.specialization}`}
                  >
                    <div
                      className="flex items-center justify-center rounded-full shrink-0"
                      style={{
                        width: '3rem',
                        height: '3rem',
                        backgroundColor: 'color-mix(in srgb, var(--category-doctor) 12%, transparent)',
                        color: 'var(--category-doctor, #0284c7)',
                      }}
                    >
                      <UserIcon className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-semibold text-sm truncate"
                        style={{ color: 'var(--text-primary, #1a1714)' }}
                      >
                        {doctorName}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: 'var(--text-secondary, #3d3830)' }}
                      >
                        {doctor.specialization}
                      </p>
                      <div className="mt-1">
                        <StarRatingDisplay rating={4.5} size="sm" showNumber={false} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <ChevronRight className="size-5" style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Select Date & Time ── */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Slot Error State */}
          {slotError && (
            <ErrorState
              title="Slot Tidak Tersedia"
              message="Slot yang Anda pilih sudah dipesan oleh pasien lain. Silakan pilih slot lain."
              category="validation"
              onRetry={handleSlotErrorRetry}
              retryLabel="Refresh Jadwal"
            />
          )}

          {/* Back button + Doctor info */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Kembali">
              <ChevronLeft className="size-5" />
            </Button>
            <div className="flex items-center gap-3 flex-1">
              <div
                className="flex items-center justify-center rounded-full shrink-0"
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  backgroundColor: 'color-mix(in srgb, var(--category-doctor) 12%, transparent)',
                  color: 'var(--category-doctor, #0284c7)',
                }}
              >
                <Stethoscope className="size-4" />
              </div>
              <div>
                <p
                  className="font-semibold text-sm"
                  style={{ color: 'var(--text-primary, #1a1714)' }}
                >
                  {wizardState.selectedDoctor?.user?.full_name ?? wizardState.selectedDoctor?.full_name}
                </p>
                <p
                  className="text-xs"
                  style={{ color: 'var(--text-secondary, #3d3830)' }}
                >
                  {wizardState.selectedDoctor?.specialization}
                </p>
              </div>
            </div>
          </div>

          {schedulesLoading ? (
            <LoadingSkeleton variant="card" count={2} />
          ) : activeSchedules.length === 0 ? (
            <div
              className="text-center py-8"
              style={{ color: 'var(--text-tertiary, #6b6358)' }}
            >
              <p className="text-sm">Tidak ada jadwal tersedia untuk dokter ini</p>
            </div>
          ) : (
            <>
              {/* Calendar Grid - Next 30 days */}
              <div
                className="rounded-[var(--radius-lg,1rem)] p-4"
                style={{
                  backgroundColor: 'var(--surface-raised, #ffffff)',
                  border: '1px solid var(--border-default, #e8e2da)',
                }}
              >
                <h3
                  className="text-sm font-semibold mb-3"
                  style={{ color: 'var(--text-primary, #1a1714)' }}
                >
                  <Calendar className="size-4 inline-block mr-2" />
                  Pilih Tanggal (30 hari ke depan)
                </h3>
                <div className="grid grid-cols-7 gap-1">
                  {/* Day headers */}
                  {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                    <div
                      key={day}
                      className="text-center text-xs font-medium py-1"
                      style={{ color: 'var(--text-tertiary, #6b6358)' }}
                    >
                      {day}
                    </div>
                  ))}
                  {/* Calendar days */}
                  {calendarDays.map((day) => (
                    <button
                      key={day.dateStr}
                      onClick={() => !day.isDisabled && handleSelectDate(day.dateStr)}
                      disabled={day.isDisabled}
                      className="relative flex flex-col items-center justify-center p-1.5 rounded-[var(--radius-sm,0.375rem)] text-xs transition-all"
                      style={{
                        backgroundColor: day.isSelected
                          ? 'var(--category-patient, #059669)'
                          : day.isToday
                            ? 'color-mix(in srgb, var(--category-patient) 8%, transparent)'
                            : undefined,
                        color: day.isSelected
                          ? 'var(--text-inverse, #ffffff)'
                          : day.isDisabled
                            ? 'var(--text-tertiary, #6b6358)'
                            : 'var(--text-primary, #1a1714)',
                        opacity: day.isDisabled ? 0.4 : 1,
                        cursor: day.isDisabled ? 'not-allowed' : 'pointer',
                      }}
                      aria-label={`${day.dateStr}${day.slotCount > 0 ? `, ${day.slotCount} slot tersedia` : ''}`}
                      aria-selected={day.isSelected}
                    >
                      <span className="font-medium">{day.dayOfMonth}</span>
                      {day.slotCount > 0 && !day.isDisabled && (
                        <span
                          className="text-[10px] leading-none mt-0.5"
                          style={{
                            color: day.isSelected
                              ? 'var(--text-inverse)'
                              : 'var(--accent-success, #059669)',
                          }}
                        >
                          {day.slotCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slots for selected date */}
              {wizardState.selectedDate && (
                <div
                  className="rounded-[var(--radius-lg,1rem)] p-4"
                  style={{
                    backgroundColor: 'var(--surface-raised, #ffffff)',
                    border: '1px solid var(--border-default, #e8e2da)',
                  }}
                >
                  <h3
                    className="text-sm font-semibold mb-3"
                    style={{ color: 'var(--text-primary, #1a1714)' }}
                  >
                    <Clock className="size-4 inline-block mr-2" />
                    Slot Waktu — {formatDisplayDate(wizardState.selectedDate)}
                  </h3>
                  {selectedDaySchedules.length === 0 ? (
                    <p
                      className="text-sm text-center py-4"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      Tidak ada slot tersedia pada tanggal ini
                    </p>
                  ) : (
                    <div className="grid gap-2">
                      {selectedDaySchedules.map((schedule) => (
                        <button
                          key={schedule.id}
                          onClick={() => handleSelectSlot(schedule)}
                          className="flex items-center justify-between p-3 rounded-[var(--radius-md,0.75rem)] border text-left transition-all hover:shadow-[var(--shadow-sm)]"
                          style={{
                            backgroundColor: wizardState.selectedSchedule?.id === schedule.id
                              ? 'color-mix(in srgb, var(--category-patient) 8%, transparent)'
                              : 'var(--surface-raised, #ffffff)',
                            borderColor: wizardState.selectedSchedule?.id === schedule.id
                              ? 'var(--category-patient, #059669)'
                              : 'var(--border-default, #e8e2da)',
                          }}
                          aria-label={`Slot ${schedule.start_time} - ${schedule.end_time}, maks ${schedule.max_patient} pasien`}
                        >
                          <div className="flex items-center gap-3">
                            <Clock
                              className="size-4"
                              style={{ color: 'var(--category-patient, #059669)' }}
                            />
                            <div>
                              <p
                                className="font-medium text-sm"
                                style={{ color: 'var(--text-primary, #1a1714)' }}
                              >
                                {schedule.start_time} - {schedule.end_time}
                              </p>
                              <p
                                className="text-xs"
                                style={{ color: 'var(--text-tertiary, #6b6358)' }}
                              >
                                Maks {schedule.max_patient} pasien
                              </p>
                            </div>
                          </div>
                          {wizardState.selectedSchedule?.id === schedule.id && (
                            <CheckCircle
                              className="size-5"
                              style={{ color: 'var(--category-patient, #059669)' }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Step 3: Confirm ── */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Back button */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Kembali">
              <ChevronLeft className="size-5" />
            </Button>
            <h3
              className="font-semibold text-sm"
              style={{ color: 'var(--text-primary, #1a1714)' }}
            >
              Konfirmasi Booking
            </h3>
          </div>

          {/* Slot Error State */}
          {slotError && (
            <ErrorState
              title="Slot Tidak Tersedia"
              message="Slot yang Anda pilih sudah dipesan oleh pasien lain. Silakan pilih slot lain."
              category="validation"
              onRetry={handleSlotErrorRetry}
              retryLabel="Pilih Slot Lain"
            />
          )}

          {!slotError && (
            <>
              {/* Booking Summary */}
              <div
                className="rounded-[var(--radius-lg,1rem)] p-5"
                style={{
                  backgroundColor: 'var(--surface-raised, #ffffff)',
                  border: '1px solid var(--border-default, #e8e2da)',
                }}
              >
                <h4
                  className="text-sm font-semibold mb-4"
                  style={{ color: 'var(--text-primary, #1a1714)' }}
                >
                  Ringkasan Booking
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span
                      className="text-sm"
                      style={{ color: 'var(--text-secondary, #3d3830)' }}
                    >
                      Dokter
                    </span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-primary, #1a1714)' }}
                    >
                      {wizardState.selectedDoctor?.user?.full_name ?? wizardState.selectedDoctor?.full_name}
                    </span>
                  </div>
                  <div
                    className="h-px"
                    style={{ backgroundColor: 'var(--border-default, #e8e2da)' }}
                  />
                  <div className="flex justify-between items-center">
                    <span
                      className="text-sm"
                      style={{ color: 'var(--text-secondary, #3d3830)' }}
                    >
                      Spesialisasi
                    </span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-primary, #1a1714)' }}
                    >
                      {wizardState.selectedDoctor?.specialization}
                    </span>
                  </div>
                  <div
                    className="h-px"
                    style={{ backgroundColor: 'var(--border-default, #e8e2da)' }}
                  />
                  <div className="flex justify-between items-center">
                    <span
                      className="text-sm"
                      style={{ color: 'var(--text-secondary, #3d3830)' }}
                    >
                      Tanggal
                    </span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-primary, #1a1714)' }}
                    >
                      {formatDisplayDate(wizardState.selectedDate)}
                    </span>
                  </div>
                  <div
                    className="h-px"
                    style={{ backgroundColor: 'var(--border-default, #e8e2da)' }}
                  />
                  <div className="flex justify-between items-center">
                    <span
                      className="text-sm"
                      style={{ color: 'var(--text-secondary, #3d3830)' }}
                    >
                      Jam Praktek
                    </span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-primary, #1a1714)' }}
                    >
                      {wizardState.selectedSchedule?.start_time} - {wizardState.selectedSchedule?.end_time}
                    </span>
                  </div>
                </div>
              </div>

              {/* Symptom Screening Form */}
              <div
                className="rounded-[var(--radius-lg,1rem)] p-5"
                style={{
                  backgroundColor: 'var(--surface-raised, #ffffff)',
                  border: '1px solid var(--border-default, #e8e2da)',
                }}
              >
                <h4
                  className="text-sm font-semibold mb-4"
                  style={{ color: 'var(--text-primary, #1a1714)' }}
                >
                  Screening Gejala (Opsional)
                </h4>
                <SymptomScreeningForm
                  appointmentId=""
                  doctorName={wizardState.selectedDoctor?.user?.full_name ?? wizardState.selectedDoctor?.full_name ?? ''}
                  onSuccess={() => {
                    toast.success('Gejala Tercatat', 'Data gejala akan dikirim setelah booking berhasil.')
                  }}
                  onCancel={() => {
                    // Skip symptom screening - proceed to submit
                  }}
                />
              </div>

              {/* Submit Button */}
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleSubmit}
                loading={bookMutation.isPending}
                disabled={bookMutation.isPending}
              >
                {bookMutation.isPending ? 'Mendaftar...' : 'Konfirmasi & Daftar Antrian'}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
