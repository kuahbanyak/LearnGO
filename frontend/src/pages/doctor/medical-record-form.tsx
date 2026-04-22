import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react'
import { medicalRecordApi } from '@/api/appointments'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Appointment } from '@/types'

interface Props {
  appointment: Appointment
  onDone: () => void
  onBack: () => void
}

interface PrescriptionForm {
  medicine_name: string
  dosage: string
  quantity: number
  usage_instruction: string
}

export default function MedicalRecordForm({ appointment, onDone, onBack }: Props) {
  const [form, setForm] = useState({
    complaint: '',
    diagnosis: '',
    icd_code: '',
    action_taken: '',
    doctor_notes: '',
  })
  const [prescriptions, setPrescriptions] = useState<PrescriptionForm[]>([])
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: medicalRecordApi.create,
    onSuccess: () => {
      toast.success('Rekam medis berhasil disimpan')
      onDone()
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      const msg = e?.response?.data?.message || 'Gagal menyimpan rekam medis'
      toast.error('Gagal menyimpan rekam medis', msg)
      setError(msg)
    },
  })

  const addPrescription = () => {
    setPrescriptions([...prescriptions, { medicine_name: '', dosage: '', quantity: 1, usage_instruction: '' }])
  }

  const removePrescription = (i: number) => {
    setPrescriptions(prescriptions.filter((_, idx) => idx !== i))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    mutation.mutate({
      appointment_id: appointment.id,
      ...form,
      prescriptions,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Buat Rekam Medis</h1>
          <p className="text-muted-foreground text-sm">
            Pasien: {appointment.patient?.user?.full_name} — No. Antrian: {appointment.queue_number}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
        )}

        <Card>
          <CardHeader><CardTitle className="text-base">Informasi Pemeriksaan</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Keluhan Pasien *', field: 'complaint', required: true },
              { label: 'Diagnosa', field: 'diagnosis', required: false },
              { label: 'Kode ICD-10', field: 'icd_code', required: false },
              { label: 'Tindakan yang Dilakukan', field: 'action_taken', required: false },
              { label: 'Catatan Dokter', field: 'doctor_notes', required: false },
            ].map(({ label, field, required }) => (
              <div key={field} className="space-y-1.5">
                <label className="text-sm font-medium">{label}</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  value={form[field as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  required={required}
                  rows={field === 'complaint' ? 3 : 2}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Resep Obat</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addPrescription}>
              <Plus className="size-3 mr-1" /> Tambah Obat
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {prescriptions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada resep obat ditambahkan</p>
            )}
            {prescriptions.map((p, i) => (
              <div key={i} className="p-4 rounded-lg border bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Obat #{i + 1}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removePrescription(i)}
                    className="text-red-400 hover:text-red-600 h-7 w-7">
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-medium text-slate-600">Nama Obat *</label>
                    <Input
                      value={p.medicine_name}
                      onChange={(e) => {
                        const updated = [...prescriptions]
                        updated[i].medicine_name = e.target.value
                        setPrescriptions(updated)
                      }}
                      required
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">Dosis</label>
                    <Input
                      placeholder="cth: 3x1"
                      value={p.dosage}
                      onChange={(e) => {
                        const updated = [...prescriptions]
                        updated[i].dosage = e.target.value
                        setPrescriptions(updated)
                      }}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">Jumlah</label>
                    <Input
                      type="number"
                      min={1}
                      value={p.quantity}
                      onChange={(e) => {
                        const updated = [...prescriptions]
                        updated[i].quantity = parseInt(e.target.value)
                        setPrescriptions(updated)
                      }}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-medium text-slate-600">Aturan Pakai</label>
                    <Input
                      placeholder="cth: Sesudah makan"
                      value={p.usage_instruction}
                      onChange={(e) => {
                        const updated = [...prescriptions]
                        updated[i].usage_instruction = e.target.value
                        setPrescriptions(updated)
                      }}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onBack}>Batal</Button>
          <Button type="submit" className="gradient-primary text-white border-0" disabled={mutation.isPending}>
            {mutation.isPending ? <><Loader2 className="size-4 animate-spin" /> Menyimpan...</> : 'Simpan Rekam Medis'}
          </Button>
        </div>
      </form>
    </div>
  )
}
