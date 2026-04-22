import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Loader2, ToggleLeft, ToggleRight } from 'lucide-react'
import { doctorApi, scheduleApi } from '@/api/doctors'
import { toast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DAYS } from '@/lib/utils'
import type { DoctorSchedule } from '@/types'

interface ScheduleModalProps {
  schedule?: DoctorSchedule | null
  onClose: () => void
  onSaved: () => void
}

function ScheduleModal({ schedule, onClose, onSaved }: ScheduleModalProps) {
  const [form, setForm] = useState({
    doctor_id: schedule?.doctor_id ?? '',
    day_of_week: schedule?.day_of_week ?? 1,
    start_time: schedule?.start_time ?? '08:00',
    end_time: schedule?.end_time ?? '12:00',
    max_patient: schedule?.max_patient ?? 20,
  })
  const [error, setError] = useState('')

  const { data: doctorsData } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorApi.getAll({ per_page: 100 }),
  })
  const doctors = doctorsData?.data?.data ?? []

  const createMutation = useMutation({
    mutationFn: scheduleApi.create,
    onSuccess: () => { toast.success('Jadwal berhasil ditambahkan'); onSaved(); onClose() },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e?.response?.data?.message || 'Gagal menyimpan jadwal')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DoctorSchedule> }) =>
      scheduleApi.update(id, data),
    onSuccess: () => { toast.success('Jadwal berhasil diperbarui'); onSaved(); onClose() },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e?.response?.data?.message || 'Gagal memperbarui jadwal')
    },
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (schedule) {
      updateMutation.mutate({
        id: schedule.id,
        data: {
          day_of_week: form.day_of_week,
          start_time: form.start_time,
          end_time: form.end_time,
          max_patient: Number(form.max_patient),
        },
      })
    } else {
      createMutation.mutate({
        doctor_id: form.doctor_id,
        day_of_week: form.day_of_week,
        start_time: form.start_time,
        end_time: form.end_time,
        max_patient: Number(form.max_patient),
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 modal-overlay">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md modal-content">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">{schedule ? 'Edit Jadwal' : 'Tambah Jadwal'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}

          {!schedule && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Dokter *</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.doctor_id}
                onChange={e => setForm({ ...form, doctor_id: e.target.value })}
                required
              >
                <option value="">Pilih dokter...</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.user?.full_name} — {d.specialization}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Hari *</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={form.day_of_week}
              onChange={e => setForm({ ...form, day_of_week: Number(e.target.value) })}
            >
              {DAYS.map((day, idx) => (
                <option key={idx} value={idx}>{day}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Jam Mulai *</label>
              <Input type="time" value={form.start_time}
                onChange={e => setForm({ ...form, start_time: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Jam Selesai *</label>
              <Input type="time" value={form.end_time}
                onChange={e => setForm({ ...form, end_time: e.target.value })} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Maks. Pasien *</label>
            <Input
              type="number" min={1} max={100}
              value={form.max_patient}
              onChange={e => setForm({ ...form, max_patient: Number(e.target.value) })}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Batal</Button>
            <Button type="submit" className="gradient-primary text-white border-0 rounded-xl shadow-md shadow-blue-500/20" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : 'Simpan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminSchedulesPage() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editSchedule, setEditSchedule] = useState<DoctorSchedule | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => scheduleApi.getAll(),
  })

  const deleteMutation = useMutation({
    mutationFn: scheduleApi.delete,
    onSuccess: () => { toast.success('Jadwal berhasil dihapus'); queryClient.invalidateQueries({ queryKey: ['schedules'] }) },
    onError: () => toast.error('Gagal menghapus jadwal'),
  })

  const toggleMutation = useMutation({
    mutationFn: scheduleApi.toggle,
    onSuccess: () => { toast.success('Status jadwal diperbarui'); queryClient.invalidateQueries({ queryKey: ['schedules'] }) },
    onError: () => toast.error('Gagal mengubah status jadwal'),
  })

  const schedules = (data?.data?.data as DoctorSchedule[] | undefined) ?? []

  // Group by doctor
  const byDoctor = schedules.reduce<Record<string, DoctorSchedule[]>>((acc, s) => {
    const key = s.doctor?.user?.full_name ?? s.doctor_id
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  const handleSaved = () => queryClient.invalidateQueries({ queryKey: ['schedules'] })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Jadwal Praktek</h1>
          <p className="text-slate-500 mt-1">Kelola jadwal praktek dokter</p>
        </div>
        <Button onClick={() => { setEditSchedule(null); setShowModal(true) }}
          className="gradient-primary text-white border-0 rounded-xl shadow-lg shadow-blue-500/25 font-semibold">
          <Plus className="size-4 mr-1" /> Tambah Jadwal
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
      ) : schedules.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <p>Belum ada jadwal. Mulai tambahkan jadwal dokter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(byDoctor).map(([doctorName, doctorSchedules]) => (
            <Card key={doctorName}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {doctorName.charAt(0)}
                  </div>
                  {doctorName}
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    — {doctorSchedules[0]?.doctor?.specialization}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {doctorSchedules.sort((a, b) => a.day_of_week - b.day_of_week).map(s => (
                    <div key={s.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium w-16 text-slate-700">
                          {DAYS[s.day_of_week]}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {s.start_time} – {s.end_time}
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">Maks {s.max_patient} pasien</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={s.is_active ? 'default' : 'secondary'}>
                          {s.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                        <button
                          onClick={() => toggleMutation.mutate(s.id)}
                          disabled={toggleMutation.isPending}
                          className="p-1.5 rounded text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                          title={s.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {s.is_active
                            ? <ToggleRight className="size-4 text-green-600" />
                            : <ToggleLeft className="size-4" />}
                        </button>
                        <button
                          onClick={() => { setEditSchedule(s); setShowModal(true) }}
                          className="p-1.5 rounded text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Hapus jadwal ini?')) deleteMutation.mutate(s.id)
                          }}
                          className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <ScheduleModal
          schedule={editSchedule}
          onClose={() => { setShowModal(false); setEditSchedule(null) }}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
