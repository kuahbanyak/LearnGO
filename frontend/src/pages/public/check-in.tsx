import { useState, useEffect, useRef, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  QrCode,
  Keyboard,
  Camera,
  CameraOff,
  AlertCircle,
  ClipboardList,
  ArrowRight,
  SkipForward,
} from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import { checkInApi } from '@/api/checkin'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { QueueTicketCard } from '@/components/shared/queue-ticket-card'
import { ErrorState } from '@/components/shared/error-state'
import SymptomScreeningForm from '@/components/shared/symptom-screening-form'

/**
 * PublicCheckinPage — Unauthenticated walk-in check-in page.
 *
 * Dual-mode: QR code scanning via device camera + manual code entry.
 * Camera permission handling: show scanner on grant, fallback to manual on deny.
 * Embeds SymptomScreeningForm as optional step before ticket issuance.
 * Displays QueueTicketCard on success.
 * Handles error states (expired/invalid/used token) with retry.
 * Responsive: stacks vertically at <640px.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 */

type CheckinStep = 'input' | 'symptom-screening' | 'success' | 'error'
type CameraState = 'idle' | 'requesting' | 'granted' | 'denied'

interface AppointmentData {
  appointment_id: string
  queue_number: number
  doctor: string
  status: string
}

export default function CheckInPage() {
  const [step, setStep] = useState<CheckinStep>('input')
  const [token, setToken] = useState('')
  const [appointmentData, setAppointmentData] = useState<AppointmentData | null>(null)
  const [cameraState, setCameraState] = useState<CameraState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [showSymptomForm, setShowSymptomForm] = useState(false)

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerContainerRef = useRef<HTMLDivElement>(null)
  const manualInputRef = useRef<HTMLInputElement>(null)
  const isScanningRef = useRef(false)

  // ─── Check-in mutation (preserves existing API call logic) ─────────────────
  const checkInMutation = useMutation({
    mutationFn: (checkinToken: string) => checkInApi.checkIn(checkinToken),
    onSuccess: (response) => {
      const data = response.data.data
      if (data) {
        setAppointmentData(data)
        // Show symptom screening step
        setStep('symptom-screening')
        toast.success('Check-in Berhasil!', `Nomor antrian Anda: ${data.queue_number}`)
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Token tidak valid atau sudah digunakan'
      setErrorMessage(message)
      setStep('error')
    },
  })

  // ─── QR Scanner lifecycle ─────────────────────────────────────────────────
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
    if (!scannerContainerRef.current || isScanningRef.current) return

    try {
      const scanner = new Html5Qrcode('qr-scanner-viewport')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // On successful decode, submit the token
          stopScanner()
          setToken(decodedText)
          checkInMutation.mutate(decodedText)
        },
        () => {
          // QR code not found in frame — ignore
        }
      )
      isScanningRef.current = true
    } catch {
      setCameraState('denied')
      manualInputRef.current?.focus()
    }
  }, [stopScanner, checkInMutation])

  const requestCameraPermission = useCallback(async () => {
    setCameraState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      // Stop the test stream immediately
      stream.getTracks().forEach((track) => track.stop())
      setCameraState('granted')
    } catch {
      setCameraState('denied')
      manualInputRef.current?.focus()
    }
  }, [])

  // Start scanner when camera is granted
  useEffect(() => {
    if (cameraState === 'granted' && step === 'input') {
      // Small delay to ensure DOM element is rendered
      const timer = setTimeout(() => {
        startScanner()
      }, 100)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [cameraState, step, startScanner])

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [stopScanner])

  // ─── Manual check-in handler ──────────────────────────────────────────────
  const handleManualCheckIn = () => {
    if (!token.trim()) {
      toast.error('Token Kosong', 'Masukkan token check-in Anda')
      return
    }
    checkInMutation.mutate(token.trim())
  }

  // ─── Retry handler ────────────────────────────────────────────────────────
  const handleRetry = () => {
    setStep('input')
    setErrorMessage('')
    setToken('')
    setAppointmentData(null)
    // Restart scanner if camera was granted
    if (cameraState === 'granted') {
      setTimeout(() => startScanner(), 100)
    }
  }

  // ─── Symptom screening handlers ───────────────────────────────────────────
  const handleSymptomSkip = () => {
    setStep('success')
  }

  const handleSymptomSuccess = () => {
    setStep('success')
  }

  // ─── Print handler ────────────────────────────────────────────────────────
  const handlePrint = () => {
    window.print()
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        backgroundColor: 'var(--surface-ground, #f5f2ed)',
      }}
    >
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
            }}
          >
            <QrCode
              className="size-8"
              style={{ color: 'var(--accent-primary)' }}
              aria-hidden="true"
            />
          </div>
          <h1
            className="text-display-lg font-display font-bold"
            style={{ color: 'var(--text-primary, #1a1714)' }}
          >
            Check-in Klinik
          </h1>
          <p
            className="mt-2 text-body-md"
            style={{ color: 'var(--text-secondary, #3d3830)' }}
          >
            Scan QR code atau masukkan kode secara manual
          </p>
        </div>

        {/* ─── Step: Input (QR + Manual) ─────────────────────────────────── */}
        {step === 'input' && (
          <div
            className="grid gap-6"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            }}
          >
            {/* QR Scanner Panel */}
            <Card surface="elevated" padding="md">
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2">
                  <Camera
                    className="size-5"
                    style={{ color: 'var(--accent-primary)' }}
                    aria-hidden="true"
                  />
                  <h2
                    className="text-lg font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Scan QR Code
                  </h2>
                </div>

                {cameraState === 'idle' && (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <p
                      className="text-sm text-center"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Izinkan akses kamera untuk memindai QR code check-in Anda
                    </p>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={requestCameraPermission}
                      leftIcon={<Camera className="size-5" />}
                    >
                      Aktifkan Kamera
                    </Button>
                  </div>
                )}

                {cameraState === 'requesting' && (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <div
                      className="size-8 border-3 rounded-full animate-spin"
                      style={{
                        borderColor: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)',
                        borderTopColor: 'var(--accent-primary)',
                      }}
                    />
                    <p
                      className="text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Meminta izin kamera...
                    </p>
                  </div>
                )}

                {cameraState === 'granted' && (
                  <div className="w-full">
                    <div
                      id="qr-scanner-viewport"
                      ref={scannerContainerRef}
                      className="w-full rounded-[var(--radius-md)] overflow-hidden"
                      style={{
                        minHeight: '250px',
                        backgroundColor: 'var(--surface-sunken)',
                      }}
                      aria-label="Area pemindai QR code"
                    />
                    <p
                      className="text-xs text-center mt-3"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      Arahkan kamera ke QR code check-in
                    </p>
                  </div>
                )}

                {cameraState === 'denied' && (
                  <div
                    className="flex flex-col items-center gap-3 py-4 px-4 rounded-[var(--radius-md)]"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--accent-warning) 8%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--accent-warning) 25%, transparent)',
                    }}
                  >
                    <CameraOff
                      className="size-8"
                      style={{ color: 'var(--accent-warning)' }}
                      aria-hidden="true"
                    />
                    <p
                      className="text-sm text-center"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Akses kamera ditolak. Gunakan input manual di sebelah kanan untuk memasukkan kode check-in.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Manual Entry Panel */}
            <Card surface="elevated" padding="md">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Keyboard
                    className="size-5"
                    style={{ color: 'var(--accent-primary)' }}
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
                  Masukkan kode check-in dari email atau WhatsApp Anda
                </p>

                <div className="flex flex-col gap-3">
                  <label
                    htmlFor="checkin-token-input"
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Kode Check-in
                  </label>
                  <input
                    id="checkin-token-input"
                    ref={manualInputRef}
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value.toUpperCase())}
                    placeholder="Contoh: A1B2C3D4E5F6..."
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
                      e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--accent-primary) 15%, transparent)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--text-primary) 15%, transparent)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleManualCheckIn()
                    }}
                    aria-describedby="token-help"
                  />
                  <p
                    id="token-help"
                    className="text-xs"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Token check-in dapat ditemukan pada QR code yang dikirimkan melalui email atau WhatsApp.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleManualCheckIn}
                  disabled={checkInMutation.isPending || !token.trim()}
                  loading={checkInMutation.isPending}
                  rightIcon={<ArrowRight className="size-5" />}
                  className="w-full"
                >
                  Check-in Sekarang
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* ─── Step: Symptom Screening (Optional) ────────────────────────── */}
        {step === 'symptom-screening' && appointmentData && (
          <Card surface="elevated" padding="lg" className="max-w-lg mx-auto">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList
                  className="size-5"
                  style={{ color: 'var(--accent-primary)' }}
                  aria-hidden="true"
                />
                <h2
                  className="text-lg font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Screening Gejala (Opsional)
                </h2>
              </div>

              <p
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Bantu dokter mempersiapkan konsultasi dengan mengisi data gejala Anda. Langkah ini opsional.
              </p>

              {showSymptomForm ? (
                <SymptomScreeningForm
                  appointmentId={appointmentData.appointment_id}
                  doctorName={appointmentData.doctor}
                  onSuccess={handleSymptomSuccess}
                  onCancel={() => setShowSymptomForm(false)}
                />
              ) : (
                <div className="flex flex-col gap-3">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => setShowSymptomForm(true)}
                    leftIcon={<ClipboardList className="size-5" />}
                    className="w-full"
                  >
                    Isi Data Gejala
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={handleSymptomSkip}
                    leftIcon={<SkipForward className="size-4" />}
                    className="w-full"
                  >
                    Lewati, Langsung ke Tiket
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* ─── Step: Success (Queue Ticket) ──────────────────────────────── */}
        {step === 'success' && appointmentData && (
          <div className="max-w-sm mx-auto">
            <QueueTicketCard
              queueNumber={appointmentData.queue_number}
              doctorName={`Dr. ${appointmentData.doctor}`}
              estimatedWaitMinutes={15}
              onPrint={handlePrint}
            />

            {/* Waiting instruction */}
            <div
              className="flex items-start gap-2 p-3 mt-4 rounded-[var(--radius-md)]"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent-info) 8%, transparent)',
                border: '1px solid color-mix(in srgb, var(--accent-info) 25%, transparent)',
              }}
            >
              <AlertCircle
                className="size-4 mt-0.5 shrink-0"
                style={{ color: 'var(--accent-info)' }}
                aria-hidden="true"
              />
              <p
                className="text-xs"
                style={{ color: 'var(--text-secondary)' }}
              >
                Dokter akan memanggil nomor Anda. Harap tetap di area tunggu.
              </p>
            </div>
          </div>
        )}

        {/* ─── Step: Error ────────────────────────────────────────────────── */}
        {step === 'error' && (
          <Card surface="elevated" padding="lg" className="max-w-md mx-auto">
            <ErrorState
              title="Check-in Gagal"
              message={errorMessage}
              category="validation"
              onRetry={handleRetry}
              retryLabel="Coba Lagi"
            />
          </Card>
        )}

        {/* Footer */}
        <p
          className="text-center text-xs mt-8"
          style={{ color: 'var(--text-tertiary, #6b6358)' }}
        >
          MediQueue © 2026 — Sistem Antrian Klinik Pintar
        </p>
      </div>
    </div>
  )
}
