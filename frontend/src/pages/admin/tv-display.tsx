import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Activity, Users } from 'lucide-react'
import { appointmentApi } from '@/api/appointments'
import { useRealtimeSync, type RealtimeMessage } from '@/hooks/use-realtime-sync'
import { DisconnectionBanner } from '@/components/shared/disconnection-banner'
import { queryKeys, STALE_TIME_DASHBOARD, GC_TIME_DASHBOARD } from '@/lib/query-keys'
import { t } from '@/lib/i18n'
import type { Appointment, QueueUpdateEvent } from '@/types'

// ── Types ──

interface DoctorQueueData {
  doctorId: string
  doctorName: string
  specialization: string
  currentlyServing: number | null
  nextThree: number[]
}

// ── Constants ──

const IDLE_TIMEOUT_MS = 60_000 // 60 seconds

// ── LiveClock (idle animation) ──

function LiveClock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div
      className="flex flex-col items-center justify-center gap-2"
      style={{
        animation: 'tvIdlePulse 4s ease-in-out infinite',
      }}
    >
      <p
        className="text-mono-xl tabular-nums"
        style={{ color: 'var(--text-primary)' }}
      >
        {now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </p>
      <p
        className="text-body-lg"
        style={{ color: 'var(--text-secondary)' }}
      >
        {now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </p>
    </div>
  )
}

// ── DoctorColumn ──

interface DoctorColumnProps {
  data: DoctorQueueData
  highlightedNumbers: Set<number>
}

function DoctorColumn({ data, highlightedNumbers }: DoctorColumnProps) {
  return (
    <div
      className="flex flex-col rounded-[var(--radius-lg)]"
      style={{
        backgroundColor: 'var(--surface-raised)',
        border: '1px solid color-mix(in srgb, var(--text-tertiary) 20%, transparent)',
        overflow: 'hidden',
      }}
    >
      {/* Doctor Name Header */}
      <div
        className="px-6 py-4"
        style={{
          borderBottom: '1px solid color-mix(in srgb, var(--text-tertiary) 15%, transparent)',
          backgroundColor: 'var(--surface-overlay)',
        }}
      >
        <h2
          className="text-heading-md text-center truncate"
          style={{ color: 'var(--category-doctor)' }}
        >
          Dr. {data.doctorName}
        </h2>
        {data.specialization && (
          <p
            className="text-body-sm text-center mt-1 truncate"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {data.specialization}
          </p>
        )}
      </div>

      {/* Currently Serving */}
      <div
        className="flex flex-col items-center justify-center px-6 py-8"
        style={{
          borderBottom: '1px solid color-mix(in srgb, var(--text-tertiary) 15%, transparent)',
        }}
      >
        <p
          className="text-label-sm uppercase tracking-widest mb-4"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Sedang Dilayani
        </p>
        {data.currentlyServing !== null ? (
          <span
            className="text-mono-xl tabular-nums"
            style={{
              color: 'var(--accent-primary)',
              animation: highlightedNumbers.has(data.currentlyServing)
                ? 'tvHighlight 600ms var(--ease-out) forwards'
                : undefined,
            }}
          >
            {data.currentlyServing}
          </span>
        ) : (
          <span
            className="text-mono-xl tabular-nums"
            style={{ color: 'var(--text-tertiary)', opacity: 0.4 }}
          >
            —
          </span>
        )}
      </div>

      {/* Next Three */}
      <div className="flex-1 px-6 py-5">
        <p
          className="text-label-sm uppercase tracking-widest mb-3"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Selanjutnya
        </p>
        <div className="flex flex-col gap-2">
          {data.nextThree.length > 0 ? (
            data.nextThree.map((num) => (
              <div
                key={num}
                className="flex items-center justify-center py-2 rounded-[var(--radius-md)]"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--surface-overlay) 60%, transparent)',
                  animation: highlightedNumbers.has(num)
                    ? 'tvHighlight 600ms var(--ease-out) forwards'
                    : undefined,
                }}
              >
                <span
                  className="text-mono-lg tabular-nums"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {num}
                </span>
              </div>
            ))
          ) : (
            <p
              className="text-body-sm text-center py-4"
              style={{ color: 'var(--text-tertiary)', opacity: 0.6 }}
            >
              Tidak ada antrian
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main TVDisplayPage ──

export default function TVDisplayPage() {
  const [searchParams] = useSearchParams()
  const soundEnabled = searchParams.get('sound') === 'on'

  // Determine theme from URL or time of day
  const themeParam = searchParams.get('theme')
  const resolvedTheme = useMemo(() => {
    if (themeParam === 'dark' || themeParam === 'high-contrast') return themeParam
    // Auto: use high-contrast during evening/night (18:00-06:00), dark otherwise
    const hour = new Date().getHours()
    return hour >= 18 || hour < 6 ? 'high-contrast' : 'dark'
  }, [themeParam])

  // State
  const [doctorQueues, setDoctorQueues] = useState<DoctorQueueData[]>([])
  const [highlightedNumbers, setHighlightedNumbers] = useState<Set<number>>(new Set())
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date())
  const [isIdle, setIsIdle] = useState(false)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Fetch initial queue data
  const today = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  const { data: initialData } = useQuery({
    queryKey: [...queryKeys.appointments.todayQueue(), 'tv-display'],
    queryFn: () => appointmentApi.getAll({ page: 1, per_page: 200, date: today }),
    staleTime: STALE_TIME_DASHBOARD,
    gcTime: GC_TIME_DASHBOARD,
    refetchInterval: 30_000, // Fallback polling at 30s
  })

  // Build doctor queue data from appointments
  const buildDoctorQueues = useCallback((appointments: Appointment[]): DoctorQueueData[] => {
    const activeAppointments = appointments.filter(
      (a) => a.status === 'waiting' || a.status === 'in_progress'
    )

    const byDoctor = activeAppointments.reduce<Record<string, Appointment[]>>((acc, appt) => {
      const key = appt.doctor_id
      if (!acc[key]) acc[key] = []
      acc[key].push(appt)
      return acc
    }, {})

    return Object.entries(byDoctor).map(([doctorId, appts]) => {
      const inProgress = appts.find((a) => a.status === 'in_progress')
      const waiting = appts
        .filter((a) => a.status === 'waiting')
        .sort((a, b) => a.queue_number - b.queue_number)

      return {
        doctorId,
        doctorName: appts[0]?.doctor?.user?.full_name ?? appts[0]?.doctor?.full_name ?? 'Unknown',
        specialization: appts[0]?.doctor?.specialization ?? '',
        currentlyServing: inProgress?.queue_number ?? null,
        nextThree: waiting.slice(0, 3).map((a) => a.queue_number),
      }
    })
  }, [])

  // Initialize doctor queues from fetched data
  useEffect(() => {
    const appointments = initialData?.data?.data ?? []
    if (appointments.length > 0) {
      setDoctorQueues(buildDoctorQueues(appointments))
    }
  }, [initialData, buildDoctorQueues])

  // Reset idle timer
  const resetIdleTimer = useCallback(() => {
    setIsIdle(false)
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
    }
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true)
    }, IDLE_TIMEOUT_MS)
  }, [])

  // Start idle timer on mount
  useEffect(() => {
    resetIdleTimer()
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
    }
  }, [resetIdleTimer])

  // Audio chime
  const playChime = useCallback(() => {
    if (!soundEnabled) return
    try {
      if (!audioRef.current) {
        // Create a simple beep using Web Audio API
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        oscillator.frequency.value = 880 // A5 note
        oscillator.type = 'sine'
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.5)
      }
    } catch {
      // Audio playback may fail silently (browser autoplay policy)
    }
  }, [soundEnabled])

  // Handle highlight animation
  const triggerHighlight = useCallback((numbers: number[]) => {
    setHighlightedNumbers(new Set(numbers))
    // Clear highlights after animation completes
    setTimeout(() => {
      setHighlightedNumbers(new Set())
    }, 700)
  }, [])

  // WebSocket integration for queue_update events
  const handleQueueUpdate = useCallback(
    (message: RealtimeMessage) => {
      if (message.type !== 'queue_update') return

      const event = message.data as QueueUpdateEvent
      setLastUpdateTime(new Date())
      resetIdleTimer()

      // Update the specific doctor's queue
      setDoctorQueues((prev) => {
        const existing = prev.find((d) => d.doctorId === event.doctor_id)
        if (existing) {
          return prev.map((d) =>
            d.doctorId === event.doctor_id
              ? {
                  ...d,
                  currentlyServing: event.current_number,
                  nextThree: event.next_numbers.slice(0, 3),
                }
              : d
          )
        }
        // New doctor appeared — add them
        return [
          ...prev,
          {
            doctorId: event.doctor_id,
            doctorName: 'Doctor',
            specialization: '',
            currentlyServing: event.current_number,
            nextThree: event.next_numbers.slice(0, 3),
          },
        ]
      })

      // Trigger highlight animation on changed numbers
      const changedNumbers = [event.current_number, ...event.next_numbers.slice(0, 3)]
      triggerHighlight(changedNumbers)

      // Play audio chime
      playChime()
    },
    [resetIdleTimer, triggerHighlight, playChime]
  )

  const { connectionState } = useRealtimeSync({
    channels: ['queue_update'],
    onMessage: handleQueueUpdate,
    pollingFallback: true,
    pollingInterval: 30_000,
    refetchKeys: [queryKeys.appointments.todayQueue() as unknown as unknown[]],
  })

  // Determine if disconnected
  const isDisconnected = connectionState === 'disconnected' || connectionState === 'reconnecting'

  return (
    <div
      data-theme={resolvedTheme}
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{
        backgroundColor: 'var(--surface-ground)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Inject keyframe animations */}
      <style>{`
        @keyframes tvHighlight {
          0% { opacity: 0.3; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes tvIdlePulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.02); }
        }
      `}</style>

      {/* Header */}
      <header
        className="shrink-0 px-8 py-4 flex items-center justify-between"
        style={{
          borderBottom: '1px solid color-mix(in srgb, var(--text-tertiary) 15%, transparent)',
          backgroundColor: 'var(--surface-raised)',
        }}
      >
        {/* Left: Brand */}
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center"
            style={{ backgroundColor: 'var(--accent-primary)', opacity: 0.9 }}
          >
            <Activity className="size-6" style={{ color: 'var(--text-inverse)' }} />
          </div>
          <div>
            <h1
              className="text-heading-lg"
              style={{ color: 'var(--text-primary)' }}
            >
              MediQueue
            </h1>
            <p
              className="text-body-sm"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {t('pages.tvDisplay')}
            </p>
          </div>
        </div>

        {/* Right: Clock */}
        <div className="text-right">
          <p
            className="text-mono-lg tabular-nums"
            style={{ color: 'var(--text-primary)' }}
          >
            {new Date().toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <p
            className="text-body-sm"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
      </header>

      {/* Reconnection Indicator */}
      {isDisconnected && (
        <div className="shrink-0 px-8 py-2">
          <DisconnectionBanner
            state={connectionState === 'reconnecting' ? 'reconnecting' : 'disconnected'}
            lastUpdated={lastUpdateTime}
          />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {isIdle && doctorQueues.length > 0 ? (
          /* Idle Animation: Clock + Date after 60s without queue change */
          <div className="flex flex-col items-center justify-center h-full">
            <LiveClock />
            <p
              className="text-body-md mt-6"
              style={{ color: 'var(--text-tertiary)', opacity: 0.6 }}
            >
              {t('pages.tvDisplay')} — Live
            </p>
          </div>
        ) : doctorQueues.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <Users
              className="size-20"
              style={{ color: 'var(--text-tertiary)', opacity: 0.3 }}
            />
            <div className="text-center">
              <h2
                className="text-heading-lg mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Tidak ada antrian aktif
              </h2>
              <p
                className="text-body-md"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Saat ini tidak ada pasien yang sedang menunggu
              </p>
            </div>
          </div>
        ) : (
          /* Doctor Queue Grid */
          <div
            className={`grid gap-6 h-full ${
              doctorQueues.length === 1
                ? 'grid-cols-1 max-w-lg mx-auto'
                : doctorQueues.length === 2
                  ? 'grid-cols-2'
                  : doctorQueues.length === 3
                    ? 'grid-cols-3'
                    : 'grid-cols-2 xl:grid-cols-4'
            }`}
          >
            {doctorQueues.map((queue) => (
              <DoctorColumn
                key={queue.doctorId}
                data={queue}
                highlightedNumbers={highlightedNumbers}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
