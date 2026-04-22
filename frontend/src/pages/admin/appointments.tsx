import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList, Loader2, Search } from 'lucide-react'
import { appointmentApi } from '@/api/appointments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'waiting', label: 'Menunggu' },
  { value: 'in_progress', label: 'Ditangani' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

export default function AdminAppointmentsPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [date, setDate] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['appointments-admin', page, status, date],
    queryFn: () => appointmentApi.getAll({ page, per_page: 15, status, date }),
    staleTime: 15000,
  })

  const appointments = data?.data?.data ?? []
  const meta = data?.data?.meta
  const totalPages = meta?.total_pages ?? 1

  const statusVariant = (s: string): 'secondary' | 'default' | 'outline' | 'destructive' => {
    if (s === 'waiting') return 'secondary'
    if (s === 'in_progress') return 'default'
    if (s === 'cancelled') return 'destructive'
    return 'outline'
  }

  const statusLabel = (s: string) => {
    if (s === 'waiting') return 'Menunggu'
    if (s === 'in_progress') return 'Ditangani'
    if (s === 'completed') return 'Selesai'
    if (s === 'cancelled') return 'Dibatalkan'
    return s
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Semua Antrian</h1>
        <p className="text-slate-500 mt-1">Pantau seluruh antrian di klinik</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          type="date"
          value={date}
          onChange={e => { setDate(e.target.value); setPage(1) }}
          className="w-44"
        />
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setStatus(opt.value); setPage(1) }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                status === opt.value
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {(date || status) && (
          <button
            onClick={() => { setDate(''); setStatus(''); setPage(1) }}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <Search className="size-3" /> Reset filter
          </button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="size-4" />
            {meta ? `${meta.total} antrian ditemukan` : 'Daftar Antrian'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <ClipboardList className="size-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Tidak ada antrian ditemukan</p>
            </div>
          ) : (
            <div className="divide-y">
              {appointments.map(appt => (
                <div key={appt.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {appt.queue_number}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{appt.patient?.user?.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {appt.doctor?.user?.full_name} · {appt.doctor?.specialization}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div className="hidden sm:block">
                      <p className="text-xs font-medium text-slate-700">{formatDate(appt.appointment_date)}</p>
                      <p className="text-xs text-muted-foreground">
                        {appt.schedule?.start_time} – {appt.schedule?.end_time}
                      </p>
                    </div>
                    <Badge variant={statusVariant(appt.status)}>
                      {statusLabel(appt.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground">Halaman {page} dari {totalPages}</p>
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
    </div>
  )
}
