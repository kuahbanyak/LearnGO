import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { doctorApi } from '@/api/doctors'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Doctor } from '@/types'

interface DoctorModalProps {
  doctor?: Doctor | null
  onClose: () => void
  onSaved: () => void
}

function DoctorModal({ doctor, onClose, onSaved }: DoctorModalProps) {
  const [form, setForm] = useState({
    email: doctor?.user?.email ?? '',
    password: '',
    full_name: doctor?.user?.full_name ?? '',
    phone: doctor?.user?.phone ?? '',
    specialization: doctor?.specialization ?? '',
    sip_number: doctor?.sip_number ?? '',
  })
  const [error, setError] = useState('')

  const createMutation = useMutation({
    mutationFn: doctorApi.create,
    onSuccess: () => { toast.success('Dokter berhasil ditambahkan'); onSaved(); onClose() },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      const msg = e?.response?.data?.message || 'Gagal menyimpan'
      setError(msg)
      toast.error('Gagal menambahkan dokter', msg)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof doctorApi.update>[1] }) =>
      doctorApi.update(id, data),
    onSuccess: () => { toast.success('Data dokter berhasil diperbarui'); onSaved(); onClose() },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      const msg = e?.response?.data?.message || 'Gagal menyimpan'
      setError(msg)
      toast.error('Gagal menambahkan dokter', msg)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (doctor) {
      updateMutation.mutate({ id: doctor.id, data: { full_name: form.full_name, phone: form.phone, specialization: form.specialization, sip_number: form.sip_number } })
    } else {
      createMutation.mutate(form)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 modal-overlay">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md modal-content">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">{doctor ? 'Edit Dokter' : 'Tambah Dokter'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
          {!doctor && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email *</label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Password *</label>
                <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} />
              </div>
            </>
          )}
          {[
            { label: 'Nama Lengkap *', field: 'full_name', required: true },
            { label: 'No. Telepon', field: 'phone', required: false },
            { label: 'Spesialisasi *', field: 'specialization', required: true },
            { label: 'No. SIP *', field: 'sip_number', required: true },
          ].map(({ label, field, required }) => (
            <div key={field} className="space-y-1.5">
              <label className="text-sm font-medium">{label}</label>
              <Input
                value={form[field as keyof typeof form]}
                onChange={e => setForm({ ...form, [field]: e.target.value })}
                required={required}
              />
            </div>
          ))}
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

export default function AdminDoctorsPage() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editDoctor, setEditDoctor] = useState<Doctor | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorApi.getAll({ per_page: 100 }),
  })

  const deleteMutation = useMutation({
    mutationFn: doctorApi.delete,
    onSuccess: () => { toast.success('Dokter berhasil dihapus'); queryClient.invalidateQueries({ queryKey: ['doctors'] }) },
    onError: () => toast.error('Gagal menghapus dokter'),
  })

  const doctors = data?.data?.data ?? []

  const handleSaved = () => queryClient.invalidateQueries({ queryKey: ['doctors'] })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Data Dokter</h1>
          <p className="text-slate-500 mt-1">Kelola akun dan profil dokter</p>
        </div>
        <Button onClick={() => { setEditDoctor(null); setShowModal(true) }}
          className="gradient-primary text-white border-0 rounded-xl shadow-lg shadow-blue-500/25 font-semibold">
          <Plus className="size-4 mr-1" /> Tambah Dokter
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full skeleton" />
                  <div className="space-y-2">
                    <div className="h-3.5 w-24 skeleton rounded" />
                    <div className="h-3 w-16 skeleton rounded" />
                  </div>
                </div>
                <div className="h-3 w-full skeleton rounded" />
                <div className="h-3 w-2/3 skeleton rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doc, idx) => (
            <div key={doc.id} className="stagger-item" style={{ animationDelay: `${idx * 60}ms` }}>
              <Card className="card-hover border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
                        {doc.user?.full_name?.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-sm">{doc.user?.full_name}</CardTitle>
                        <p className="text-[11px] text-slate-400">{doc.specialization}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditDoctor(doc); setShowModal(true) }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Pencil className="size-3.5" />
                      </button>
                      <button onClick={() => deleteMutation.mutate(doc.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2 text-xs text-slate-400">
                  <p className="flex items-center gap-1.5">✉️ {doc.user?.email}</p>
                  <p className="flex items-center gap-1.5">📋 SIP: {doc.sip_number}</p>
                  {doc.user?.phone && <p className="flex items-center gap-1.5">📞 {doc.user.phone}</p>}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <DoctorModal
          doctor={editDoctor}
          onClose={() => { setShowModal(false); setEditDoctor(null) }}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
