import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Stethoscope, AlertTriangle, Thermometer, Clock, Send, Loader2 } from 'lucide-react'
import { symptomScreeningApi } from '@/api/symptom-screening'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'


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

  const severityColors = {
    mild: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    moderate: 'bg-amber-50 border-amber-200 text-amber-700',
    severe: 'bg-red-50 border-red-200 text-red-700',
  }

  const severityLabels = {
    mild: 'Ringan',
    moderate: 'Sedang',
    severe: 'Berat',
  }

  return (
    <div className="space-y-6">
      {/* Doctor Info */}
      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
        <Stethoscope className="size-5 text-blue-600" />
        <div>
          <p className="text-xs text-blue-600">Konsultasi dengan</p>
          <p className="font-semibold text-blue-900">Dr. {doctorName}</p>
        </div>
      </div>

      {/* Symptoms Selection */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-3 block">
          Gejala yang Dirasakan <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {COMMON_SYMPTOMS.map((symptom) => (
            <button
              key={symptom}
              type="button"
              onClick={() => toggleSymptom(symptom)}
              className={`px-3 py-2 rounded-lg text-sm text-left transition-all ${
                selectedSymptoms.includes(symptom)
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {symptom}
            </button>
          ))}
        </div>
        {selectedSymptoms.length > 0 && (
          <p className="text-xs text-slate-500 mt-2">{selectedSymptoms.length} gejala dipilih</p>
        )}
      </div>

      {/* Severity */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-3 block">
          Tingkat Keparahan <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['mild', 'moderate', 'severe'] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setSeverity(level)}
              className={`px-4 py-3 rounded-lg text-sm font-medium border-2 transition-all ${
                severity === level
                  ? severityColors[level]
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {severityLabels[level]}
            </button>
          ))}
        </div>
      </div>

      {/* Duration & Temperature */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
            <Clock className="size-3.5" /> Durasi
          </label>
          <input
            type="text"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="contoh: 3 hari"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
            <Thermometer className="size-3.5" /> Suhu Tubuh
          </label>
          <input
            type="text"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            placeholder="contoh: 38.5°C"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Additional Notes */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">Catatan Tambahan</label>
        <textarea
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          placeholder="Informasi lain yang ingin disampaikan ke dokter..."
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        />
      </div>

      {/* Warning */}
      {severity === 'severe' && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="size-4 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-red-800">Gejala Berat Terdeteksi</p>
            <p className="text-xs text-red-700 mt-0.5">
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
          className="flex-1 gradient-primary text-white"
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
