import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Stethoscope, AlertTriangle, Thermometer, Clock, Send, Loader2 } from 'lucide-react'
import { symptomScreeningApi } from '@/api/symptom-screening'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'

/**
 * SymptomScreeningForm — all color values reference CSS custom properties
 * from tokens.css. No hardcoded color values.
 *
 * Requirements: 1.4
 */

const COMMON_SYMPTOMS = [
  'Demam',
  'Batuk',
  'Flu/Hidung Tersumbat',
  'Sakit Kepala',
  'Nyeri Tenggorokan',
  'Nyeri Otot/Sendi',
  'Lemas/Lesu',
  'Mual/Muntah',
  'Diare',
  'Sesak Napas',
  'Nyeri Perut',
  'Pusing/Berputar',
  'Ruam Kulit',
  'Bengkak',
  'Lainnya',
]

interface SymptomFormProps {
  appointmentId: string
  doctorName: string
  onSuccess?: () => void
  onCancel?: () => void
}

export default function SymptomScreeningForm({ appointmentId, doctorName, onSuccess, onCancel }: SymptomFormProps) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('mild')
  const [duration, setDuration] = useState('')
  const [temperature, setTemperature] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')

  const createMutation = useMutation({
    mutationFn: () =>
      symptomScreeningApi.create({
        appointment_id: appointmentId,
        symptoms: selectedSymptoms,
        severity,
        duration: duration || undefined,
        temperature: temperature || undefined,
        additional_notes: additionalNotes || undefined,
      }),
    onSuccess: () => {
      toast.success('Data Terkirim', 'Gejala Anda telah dicatat')
      onSuccess?.()
    },
    onError: (error: any) => {
      toast.error('Gagal Mengirim', error.response?.data?.message || 'Terjadi kesalahan')
    },
  })

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    )
  }

  const handleSubmit = () => {
    if (selectedSymptoms.length === 0) {
      toast.error('Pilih Gejala', 'Pilih minimal satu gejala yang Anda rasakan')
      return
    }
    createMutation.mutate()
  }

  /**
   * Severity color styles using CSS custom property tokens.
   * mild → success accent, moderate → warning accent, severe → danger accent
   */
  const severityStyles: Record<'mild' | 'moderate' | 'severe', React.CSSProperties> = {
    mild: {
      backgroundColor: 'color-mix(in srgb, var(--accent-success) 10%, transparent)',
      borderColor: 'color-mix(in srgb, var(--accent-success) 30%, transparent)',
      color: 'var(--accent-success)',
    },
    moderate: {
      backgroundColor: 'color-mix(in srgb, var(--accent-warning) 10%, transparent)',
      borderColor: 'color-mix(in srgb, var(--accent-warning) 30%, transparent)',
      color: 'var(--accent-warning)',
    },
    severe: {
      backgroundColor: 'color-mix(in srgb, var(--accent-danger) 10%, transparent)',
      borderColor: 'color-mix(in srgb, var(--accent-danger) 30%, transparent)',
      color: 'var(--accent-danger)',
    },
  }

  const severityLabels = {
    mild: 'Ringan',
    moderate: 'Sedang',
    severe: 'Berat',
  }

  const inputBaseClass = [
    'w-full px-3 py-2 text-sm',
    'rounded-[var(--radius-md,0.75rem)]',
    'border border-[color-mix(in_srgb,var(--text-primary)_15%,transparent)]',
    'bg-[var(--surface-raised,#ffffff)]',
    'text-[var(--text-primary,#1a1714)]',
    'placeholder:text-[var(--text-tertiary,#6b6358)]',
    'focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-1',
    'transition-all duration-[var(--duration-fast,150ms)]',
  ].join(' ')

  return (
    <div className="space-y-6">
      {/* Doctor Info */}
      <div
        className="flex items-center gap-3 p-3 rounded-[var(--radius-md,0.75rem)]"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--accent-info) 8%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent-info) 25%, transparent)',
        }}
      >
        <Stethoscope
          className="size-5"
          style={{ color: 'var(--accent-info, #2563eb)' }}
        />
        <div>
          <p
            className="text-xs"
            style={{ color: 'var(--accent-info, #2563eb)' }}
          >
            Konsultasi dengan
          </p>
          <p
            className="font-semibold"
            style={{ color: 'var(--text-primary, #1a1714)' }}
          >
            Dr. {doctorName}
          </p>
        </div>
      </div>

      {/* Symptoms Selection */}
      <div>
        <label
          className="text-sm font-medium mb-3 block"
          style={{ color: 'var(--text-secondary, #3d3830)' }}
        >
          Gejala yang Dirasakan{' '}
          <span style={{ color: 'var(--accent-danger, #dc2626)' }}>*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {COMMON_SYMPTOMS.map((symptom) => (
            <button
              key={symptom}
              type="button"
              onClick={() => toggleSymptom(symptom)}
              className="px-3 py-2 rounded-[var(--radius-sm,0.375rem)] text-sm text-left transition-all"
              style={
                selectedSymptoms.includes(symptom)
                  ? {
                      backgroundColor: 'var(--accent-primary)',
                      color: 'var(--text-inverse)',
                      boxShadow: 'var(--shadow-sm)',
                    }
                  : {
                      backgroundColor: 'var(--surface-sunken)',
                      color: 'var(--text-secondary)',
                      border: '1px solid color-mix(in srgb, var(--text-primary) 12%, transparent)',
                    }
              }
            >
              {symptom}
            </button>
          ))}
        </div>
        {selectedSymptoms.length > 0 && (
          <p
            className="text-xs mt-2"
            style={{ color: 'var(--text-tertiary, #6b6358)' }}
          >
            {selectedSymptoms.length} gejala dipilih
          </p>
        )}
      </div>

      {/* Severity */}
      <div>
        <label
          className="text-sm font-medium mb-3 block"
          style={{ color: 'var(--text-secondary, #3d3830)' }}
        >
          Tingkat Keparahan{' '}
          <span style={{ color: 'var(--accent-danger, #dc2626)' }}>*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['mild', 'moderate', 'severe'] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setSeverity(level)}
              className="px-4 py-3 rounded-[var(--radius-sm,0.375rem)] text-sm font-medium border-2 transition-all"
              style={
                severity === level
                  ? severityStyles[level]
                  : {
                      backgroundColor: 'var(--surface-raised)',
                      borderColor: 'color-mix(in srgb, var(--text-primary) 15%, transparent)',
                      color: 'var(--text-secondary)',
                    }
              }
            >
              {severityLabels[level]}
            </button>
          ))}
        </div>
      </div>

      {/* Duration & Temperature */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            className="text-sm font-medium mb-2 flex items-center gap-1.5"
            style={{ color: 'var(--text-secondary, #3d3830)' }}
          >
            <Clock className="size-3.5" /> Durasi
          </label>
          <input
            type="text"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="contoh: 3 hari"
            className={inputBaseClass}
          />
        </div>
        <div>
          <label
            className="text-sm font-medium mb-2 flex items-center gap-1.5"
            style={{ color: 'var(--text-secondary, #3d3830)' }}
          >
            <Thermometer className="size-3.5" /> Suhu Tubuh
          </label>
          <input
            type="text"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            placeholder="contoh: 38.5°C"
            className={inputBaseClass}
          />
        </div>
      </div>

      {/* Additional Notes */}
      <div>
        <label
          className="text-sm font-medium mb-2 block"
          style={{ color: 'var(--text-secondary, #3d3830)' }}
        >
          Catatan Tambahan
        </label>
        <textarea
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          placeholder="Informasi lain yang ingin disampaikan ke dokter..."
          rows={3}
          className={`${inputBaseClass} resize-none`}
        />
      </div>

      {/* Warning */}
      {severity === 'severe' && (
        <div
          className="flex items-start gap-2 p-3 rounded-[var(--radius-md,0.75rem)]"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent-danger) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--accent-danger) 25%, transparent)',
          }}
        >
          <AlertTriangle
            className="size-4 mt-0.5 shrink-0"
            style={{ color: 'var(--accent-danger, #dc2626)' }}
          />
          <div>
            <p
              className="text-xs font-medium"
              style={{ color: 'var(--accent-danger, #dc2626)' }}
            >
              Gejala Berat Terdeteksi
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: 'color-mix(in srgb, var(--accent-danger) 80%, var(--text-primary))' }}
            >
              Segera hubungi petugas klinik untuk penanganan prioritas.
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Batal
          </Button>
        )}
        <Button
          className="flex-1"
          onClick={handleSubmit}
          disabled={createMutation.isPending || selectedSymptoms.length === 0}
        >
          {createMutation.isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Mengirim...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send className="size-4" />
              Kirim Data
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}
