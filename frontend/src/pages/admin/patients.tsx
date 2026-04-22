import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Users, Loader2, Eye } from 'lucide-react'
import { patientApi } from '@/api/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import type { Patient } from '@/types'

function PatientDetailModal({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 modal-overlay">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg modal-content">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Detail Pasien</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">✕</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-white text-2xl font-bold">
              {patient.user?.full_name?.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{patient.user?.full_name}</h3>
              <p className="text-sm text-muted-foreground">{patient.user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'NIK', value: patient.nik || '-' },
              { label: 'Telepon', value: patient.user?.phone || '-' },
              { label: 'Tanggal Lahir', value: patient.date_of_birth ? formatDate(patient.date_of_birth) : '-' },
              { label: 'Jenis Kelamin', value: patient.gender === 'male' ? 'Laki-laki' : patient.gender === 'female' ? 'Perempuan' : '-' },
              { label: 'Golongan Darah', value: patient.blood_type || '-' },
              { label: 'Alergi', value: patient.allergies || '-' },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {patient.address && (
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-muted-foreground">Alamat</p>
              <p className="text-sm font-medium mt-0.5">{patient.address}</p>
            </div>
          )}
        </div>
        <div className="px-6 pb-5">
          <Button variant="outline" className="w-full" onClick={onClose}>Tutup</Button>
        </div>
      </div>
    </div>
  )
}

export default function AdminPatientsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['patients', page, search],
    queryFn: () => patientApi.getAll({ page, per_page: 10, search }),
    staleTime: 30000,
  })

  const patients = data?.data?.data ?? []
  const meta = data?.data?.meta
  const totalPages = meta?.total_pages ?? 1

  return (
    <div className="space-y-6">
      <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Data Pasien</h1>
          <p className="text-slate-500 mt-1">Daftar semua pasien terdaftar</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Cari nama atau email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="size-4" />
            {meta ? `${meta.total} pasien ditemukan` : 'Daftar Pasien'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : patients.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Users className="size-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Tidak ada pasien ditemukan</p>
            </div>
          ) : (
            <div className="divide-y">
              {patients.map(patient => (
                <div key={patient.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {patient.user?.full_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{patient.user?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{patient.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {patient.blood_type && (
                      <Badge variant="outline" className="text-xs">{patient.blood_type}</Badge>
                    )}
                    <Badge variant={patient.user?.is_active ? 'default' : 'secondary'}>
                      {patient.user?.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                    <button
                      onClick={() => setSelectedPatient(patient)}
                      className="p-1.5 rounded text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Lihat detail"
                    >
                      <Eye className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Halaman {page} dari {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                  ← Sebelumnya
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                  Berikutnya →
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPatient && (
        <PatientDetailModal patient={selectedPatient} onClose={() => setSelectedPatient(null)} />
      )}
    </div>
  )
}
