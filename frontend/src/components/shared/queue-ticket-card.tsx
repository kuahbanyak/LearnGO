import { Printer, Clock, User, Stethoscope } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

/**
 * QueueTicketCard — Displays an issued queue ticket with the queue number
 * rendered in mono-xl typography, doctor name, estimated wait time,
 * optional patient name, and a print action.
 *
 * Used on the Public Check-in Page (Req 3.5), Admin Scan Check-in (Req 12.2),
 * and Patient My Queue Page (Req 18.1).
 *
 * All visual values reference CSS custom properties from the design token system.
 */

export interface QueueTicketCardProps {
  /** Queue number displayed prominently in mono-xl typography */
  queueNumber: number
  /** Name of the assigned doctor */
  doctorName: string
  /** Estimated wait time in minutes */
  estimatedWaitMinutes: number
  /** Optional patient name (shown on admin scan check-in) */
  patientName?: string
  /** Callback invoked when the print button is clicked */
  onPrint?: () => void
  /** Additional CSS class names */
  className?: string
}

export function QueueTicketCard({
  queueNumber,
  doctorName,
  estimatedWaitMinutes,
  patientName,
  onPrint,
  className,
}: QueueTicketCardProps) {
  return (
    <Card
      as="article"
      surface="elevated"
      padding="lg"
      className={cn('queue-ticket-card', className)}
      aria-label={`Tiket antrian nomor ${queueNumber}`}
    >
      {/* Header label */}
      <div
        className="text-center"
        style={{ marginBottom: 'var(--space-2, 0.5rem)' }}
      >
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'var(--text-tertiary, #6b6358)' }}
        >
          Nomor Antrian
        </span>
      </div>

      {/* Queue number — mono-xl typography token */}
      <div
        className="text-center"
        style={{ marginBottom: 'var(--space-6, 1.5rem)' }}
      >
        <span
          className="text-mono-xl"
          style={{ color: 'var(--accent-primary, #0284c7)' }}
          aria-label={`Nomor ${queueNumber}`}
        >
          {queueNumber}
        </span>
      </div>

      {/* Divider */}
      <div
        style={{
          height: '1px',
          backgroundColor: 'var(--border-default, hsl(40 20% 90%))',
          marginBottom: 'var(--space-4, 1rem)',
        }}
        aria-hidden="true"
      />

      {/* Ticket details */}
      <div
        className="flex flex-col"
        style={{ gap: 'var(--space-3, 0.75rem)' }}
      >
        {/* Patient name (optional) */}
        {patientName && (
          <div className="flex items-center" style={{ gap: 'var(--space-3, 0.75rem)' }}>
            <User
              className="size-4 shrink-0"
              style={{ color: 'var(--text-tertiary, #6b6358)' }}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <span
                className="text-xs"
                style={{ color: 'var(--text-tertiary, #6b6358)' }}
              >
                Pasien
              </span>
              <p
                className="text-sm font-medium truncate"
                style={{ color: 'var(--text-primary, #1a1714)' }}
              >
                {patientName}
              </p>
            </div>
          </div>
        )}

        {/* Doctor name */}
        <div className="flex items-center" style={{ gap: 'var(--space-3, 0.75rem)' }}>
          <Stethoscope
            className="size-4 shrink-0"
            style={{ color: 'var(--text-tertiary, #6b6358)' }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <span
              className="text-xs"
              style={{ color: 'var(--text-tertiary, #6b6358)' }}
            >
              Dokter
            </span>
            <p
              className="text-sm font-medium truncate"
              style={{ color: 'var(--text-primary, #1a1714)' }}
            >
              {doctorName}
            </p>
          </div>
        </div>

        {/* Estimated wait time */}
        <div className="flex items-center" style={{ gap: 'var(--space-3, 0.75rem)' }}>
          <Clock
            className="size-4 shrink-0"
            style={{ color: 'var(--text-tertiary, #6b6358)' }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <span
              className="text-xs"
              style={{ color: 'var(--text-tertiary, #6b6358)' }}
            >
              Estimasi Tunggu
            </span>
            <p
              className="text-sm font-medium"
              style={{ color: 'var(--text-primary, #1a1714)' }}
            >
              {estimatedWaitMinutes} menit
            </p>
          </div>
        </div>
      </div>

      {/* Print action */}
      {onPrint && (
        <div
          className="flex justify-center"
          style={{ marginTop: 'var(--space-6, 1.5rem)' }}
        >
          <Button
            variant="outline"
            size="md"
            onClick={onPrint}
            leftIcon={<Printer className="size-4" />}
            aria-label="Cetak tiket antrian"
          >
            Cetak Tiket
          </Button>
        </div>
      )}
    </Card>
  )
}
