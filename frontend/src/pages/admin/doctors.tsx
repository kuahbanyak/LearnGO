import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
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
    onSuccess: () => { onSaved(); onClose() },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e?.response?.data?.message || 'Gagal menyimpan')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof doctorApi.update>[1] }) =>
      doctorApi.update(id, data),
    onSuccess: () => { onSaved(); onClose() },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e?.response?.data?.message || 'Gagal menyimpan')
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">{doctor ? 'Edit Dokter' : 'Tambah Dokter'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
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
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" className="gradient-primary text-white border-0" disabled={isPending}>
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['doctors'] }),
  })

  const doctors = data?.data?.data ?? []

  const handleSaved = () => queryClient.invalidateQueries({ queryKey: ['doctors'] })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Data Dokter</h1>
          <p className="text-muted-foreground mt-1">Kelola akun dan profil dokter</p>
        </div>
        <Button onClick={() => { setEditDoctor(null); setShowModal(true) }}
          className="gradient-primary text-white border-0">
          <Plus className="size-4 mr-1" /> Tambah Dokter
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold">
                      {doc.user?.full_name?.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-sm">{doc.user?.full_name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{doc.specialization}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditDoctor(doc); setShowModal(true) }}
                      className="p-1.5 rounded text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors">
                      <Pencil className="size-3.5" />
                    </button>
                    <button onClick={() => deleteMutation.mutate(doc.id)}
                      className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-1.5 text-xs text-muted-foreground">
                <p>✉️ {doc.user?.email}</p>
                <p>📋 SIP: {doc.sip_number}</p>
                {doc.user?.phone && <p>📞 {doc.user.phone}</p>}
              </CardContent>
            </Card>
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
