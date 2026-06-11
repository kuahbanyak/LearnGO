import { useState, useRef, useEffect, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Camera,
  Keyboard,
  ArrowRight,
  QrCode,
} from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import { checkInApi } from '@/api/checkin'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { QueueTicketCard } from '@/components/shared/queue-ticket-card'
import { ErrorState } from '@/components/shared/error-state'

/**
 * AdminScanCheckinPage — Admin-operated check-in counter page.
 *
 * Fullscreen camera viewport for QR token scanning.
 * Submits decoded token to check-in endpoint.
 * Displays queue ticket (queue#, patient, doctor, wait time) via QueueTicketCard.
 * Manual entry fallback identical to PublicCheckinPage manual mode.
 * Auto-clears displayed ticket after 10 seconds, keeps camera active.
 * Handles camera initialization failure with ErrorState + manual fallback.
 *
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

type CameraState = 'idle' | 'requesting' | 'active' | 'failed'

interface TicketData {
  appointment_id: string
  queue_number: number
  doctor: string
  status: string
}

export default function AdminScanCheckinPage() {
  const [cameraState, setCameraState] = useState<CameraState>('idle')
  const [cameraError, setCameraError] = useState('')
  const [ticketData, setTicketData] = useState<TicketData | null>(null)
  const [manualToken, setManualToken] = useState('')
  const [showManualEntry, setShowManualEntry] = useState(false)

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const isScanningRef = useRef(false)
  const autoClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const manualInputRef = useRef<HTMLInputElement>(null)

  // ─── Check-in mutation ─────────────────────────────────────────────────────
  const checkInMutation = useMutation({
    mutationFn: (token: string) => checkInApi.checkIn(token),
    onSuccess: (response) => {
      const data = response.data.data
      if (data) {
        setTicketData(data)
        toast.success('Check-in Berhasil!', `Antrian #${data.queue_number} telah masuk.`)
        // Auto-clear after 10 seconds (Req 12.4)
        startAutoClearTimer()
      }
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Token tidak valid atau sudah digunakan'
      toast.error('Check-in Gagal', message)
    },
  })

  // ─── Auto-clear timer (Req 12.4) ──────────────────────────────────────────
  const startAutoClearTimer = useCallback(() => {
    if (autoClearTimerRef.current) {
      clearTimeout(autoClearTimerRef.current)
    }
    autoClearTimerRef.current = setTimeout(() => {
      setTicketData(null)
      setManualToken('')
    }, 10_000)
  }, [])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoClearTimerRef.current) {
        clearTimeout(autoClearTimerRef.current)
      }
    }
  }, [])

  // ─── Scanner lifecycle ─────────────────────────────────────────────────────
  const stopScanner = useCallback(async () => {
    if (scannerRef.current && isScanningRef.current) {
      try {
        await scannerRef.current.stop()
        isScanningRef.current = false
      } catch {
        // Scanner may already be stopped
      }
    }
  }, [])

  const startScanner = useCallback(async () => {
    if (isScanningRef.current) return

    try {
      const scanner = new Html5Qrcode('admin-qr-scanner-viewport')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 280 },
        },
        (decodedText) => {
          // Submit decoded token (Req 12.2)
          if (!checkInMutation.isPending) {
            checkInMutation.mutate(decodedText)
          }
        },
        () => {
          // QR code not found in frame — ignore
        }
      )
      isScanningRef.current = true
      setCameraState('active')
    } catch {
      setCameraState('failed')
      setCameraError('Kamera tidak tersedia atau izin ditolak. Gunakan input manual.')
      setShowManualEntry(true)
    }
  }, [checkInMutation])

  const initializeCamera = useCallback(async () => {
    setCameraState('requesting')
    setCameraError('')

    try {
      // Test camera access first
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach((track) => track.stop())

      // Small delay to ensure DOM element is rendered
      setTimeout(() => {
        startScanner()
      }, 150)
    } catch {
      setCameraState('failed')
      setCameraError(
        'Tidak dapat mengakses kamera. Pastikan kamera tersedia dan izin diberikan.'
      )
      setShowManualEntry(true)
    }
  }, [startScanner])

  // Auto-initialize camera on mount (Req 12.1 — fullscreen camera viewport)
  useEffect(() => {
    initializeCamera()
    return () => {
      stopScanner()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Manual check-in handler (Req 12.3) ───────────────────────────────────
  const handleManualCheckIn = () => {
    if (!manualToken.trim()) {
      toast.error('Token Kosong', 'Masukkan token check-in')
      return
    }
    checkInMutation.mutate(manualToken.trim())
  }

  // ─── Dismiss ticket manually ──────────────────────────────────────────────
  const handleDismissTicket = () => {
    if (autoClearTimerRef.current) {
      clearTimeout(autoClearTimerRef.current)
    }
    setTicketData(null)
    setManualToken('')
  }

  // ─── Retry camera initialization ─────────────────────────────────────────
  const handleRetryCamera = () => {
    setCameraState('idle')
    setCameraError('')
    initializeCamera()
  }

  // ─── Print handler ────────────────────────────────────────────────────────
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Scan Check-in"
        subtitle="Scan QR code pasien untuk proses check-in"
        category="admin"
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowManualEntry(!showManualEntry)}
            leftIcon={<Keyboard className="size-4" />}
          >
            {showManualEntry ? 'Sembunyikan Manual' : 'Input Manual'}
          </Button>
        }
      />

      <div className="flex-1 flex flex-col lg:flex-row gap-6">
        {/* ─── Camera Viewport (Req 12.1 — fullscreen camera) ──────────── */}
        <div className="flex-1 flex flex-col min-h-0">
          {cameraState === 'failed' ? (
            // Camera failure → ErrorState + manual fallback (Req 12.5)
            <Card surface="elevated" padding="lg" className="flex-1 flex items-center justify-center">
              <ErrorState
                title="Kamera Tidak Tersedia"
                message={cameraError}
                category="network"
                onRetry={handleRetryCamera}
                retryLabel="Coba Lagi"
              />
            </Card>
          ) : (
            <Card surface="elevated" padding="none" className="flex-1 flex flex-col overflow-hidden">
              {/* Scanner header */}
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{
                  borderBottom: '1px solid var(--border-default, #e8e2da)',
                }}
              >
                <Camera
                  className="size-5"
                  style={{ color: 'var(--category-admin, #7c3aed)' }}
                  aria-hidden="true"
                />
                <span
                  className="text-sm font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Kamera Scanner
                </span>
                {cameraState === 'active' && (
                  <span
                    className="ml-auto inline-flex items-center gap-1.5 text-xs"
                    style={{ color: 'var(--accent-success, #059669)' }}
                  >
                    <span
                      className="size-2 rounded-full animate-pulse"
                      style={{ backgroundColor: 'var(--accent-success, #059669)' }}
                    />
                    Aktif
                  </span>
                )}
              </div>

              {/* Scanner viewport */}
              <div className="flex-1 relative flex items-center justify-center" style={{ minHeight: '350px' }}>
                {cameraState === 'requesting' && (
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className="size-10 border-3 rounded-full animate-spin"
                      style={{
                        borderColor: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)',
                        borderTopColor: 'var(--accent-primary)',
                      }}
                    />
                    <p
                      className="text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Menginisialisasi kamera...
                    </p>
                  </div>
                )}

                <div
                  id="admin-qr-scanner-viewport"
                  className="w-full h-full"
                  style={{
                    display: cameraState === 'active' ? 'block' : 'none',
                    backgroundColor: 'var(--surface-sunken, #000)',
                  }}
                  aria-label="Area pemindai QR code"
                />
              </div>

              {/* Scanner footer hint */}
              {cameraState === 'active' && (
                <div
                  className="px-4 py-2 text-center"
                  style={{
                    borderTop: '1px solid var(--border-default, #e8e2da)',
                    backgroundColor: 'var(--surface-sunken)',
                  }}
                >
                  <p
                    className="text-xs"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Arahkan QR code pasien ke kamera untuk check-in otomatis
                  </p>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* ─── Right Panel: Manual Entry + Ticket Display ─────────────── */}
        <div
          className="flex flex-col gap-4"
          style={{ width: '100%', maxWidth: '380px' }}
        >
          {/* Ticket display (Req 12.2) */}
          {ticketData && (
            <div className="relative" aria-live="polite">
              <QueueTicketCard
                queueNumber={ticketData.queue_number}
                doctorName={`Dr. ${ticketData.doctor}`}
                patientName="Pasien Terdaftar"
                estimatedWaitMinutes={15}
                onPrint={handlePrint}
              />

              {/* Auto-clear indicator */}
              <div
                className="mt-2 flex items-center justify-between"
                style={{ padding: '0 var(--space-2, 0.5rem)' }}
              >
                <p
                  className="text-xs"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Otomatis hilang dalam 10 detik
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismissTicket}
                >
                  Tutup
                </Button>
              </div>
            </div>
          )}

          {/* Manual entry fallback (Req 12.3) */}
          {(showManualEntry || cameraState === 'failed') && (
            <Card surface="elevated" padding="md">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Keyboard
                    className="size-5"
                    style={{ color: 'var(--category-admin, #7c3aed)' }}
                    aria-hidden="true"
                  />
                  <h2
                    className="text-lg font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Input Manual
                  </h2>
                </div>

                <p
                  className="text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Masukkan kode check-in dari email atau WhatsApp pasien
                </p>

                <div className="flex flex-col gap-3">
                  <label
                    htmlFor="admin-checkin-token-input"
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Kode Check-in
                  </label>
                  <input
                    id="admin-checkin-token-input"
                    ref={manualInputRef}
                    type="text"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value.toLowerCase())}
                    placeholder="Contoh: a1b2c3d4e5f6..."
                    maxLength={64}
                    className="w-full px-4 py-3 text-center text-lg font-mono tracking-wider transition-all"
                    style={{
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid color-mix(in srgb, var(--text-primary) 15%, transparent)',
                      backgroundColor: 'var(--surface-raised)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent-primary)'
                      e.currentTarget.style.boxShadow =
                        '0 0 0 3px color-mix(in srgb, var(--accent-primary) 15%, transparent)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor =
                        'color-mix(in srgb, var(--text-primary) 15%, transparent)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleManualCheckIn()
                    }}
                    aria-describedby="admin-token-help"
                  />
                  <p
                    id="admin-token-help"
                    className="text-xs"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Token check-in terdapat pada QR code yang dikirimkan melalui email atau WhatsApp.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleManualCheckIn}
                  disabled={checkInMutation.isPending || !manualToken.trim()}
                  loading={checkInMutation.isPending}
                  rightIcon={<ArrowRight className="size-5" />}
                  className="w-full"
                >
                  Check-in
                </Button>
              </div>
            </Card>
          )}

          {/* Quick info when no ticket and no manual entry shown */}
          {!ticketData && !showManualEntry && cameraState !== 'failed' && (
            <Card surface="sunken" padding="md">
              <div className="flex flex-col items-center gap-3 text-center">
                <QrCode
                  className="size-10"
                  style={{ color: 'var(--text-tertiary)' }}
                  aria-hidden="true"
                />
                <p
                  className="text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Scan QR code pasien untuk memproses check-in. Tiket antrian akan ditampilkan di sini.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowManualEntry(true)}
                  leftIcon={<Keyboard className="size-4" />}
                >
                  Atau gunakan input manual
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
