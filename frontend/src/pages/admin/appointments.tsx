import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ClipboardList, Loader2, Search, Clock, UserCheck, CheckCircle, XCircle, Calendar as CalendarIcon, Filter, AlertTriangle } from 'lucide-react'
import { appointmentApi } from '@/api/appointments'
import { toast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status', icon: ClipboardList, color: 'text-slate-600', activeColor: 'bg-slate-800 text-white border-slate-800' },
  { value: 'waiting', label: 'Menunggu', icon: Clock, color: 'text-amber-600', activeColor: 'bg-amber-500 text-white border-amber-500' },
  { value: 'in_progress', label: 'Ditangani', icon: UserCheck, color: 'text-blue-600', activeColor: 'bg-blue-500 text-white border-blue-500' },
  { value: 'completed', label: 'Selesai', icon: CheckCircle, color: 'text-emerald-600', activeColor: 'bg-emerald-500 text-white border-emerald-500' },
  { value: 'cancelled', label: 'Dibatalkan', icon: XCircle, color: 'text-red-600', activeColor: 'bg-red-500 text-white border-red-500' },
]

export default function AdminAppointmentsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [date, setDate] = useState('')
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null)

  const cancelMutation = useMutation({
    mutationFn: (id: string) => appointmentApi.cancel(id),
    onSuccess: () => {
      toast.success('Antrian berhasil dibatalkan')
      setAppointmentToCancel(null)
      queryClient.invalidateQueries({ queryKey: ['appointments-admin'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Gagal membatalkan antrian')
    },
  })

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

      {/* Filters Area */}
      <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                type="date"
                value={date}
                onChange={e => { setDate(e.target.value); setPage(1) }}
                className="pl-9 h-10 w-full sm:w-[160px] rounded-xl border-slate-200 bg-white hover:border-slate-300 focus:ring-primary/20 transition-all"
              />
            </div>
            {(date || status) && (
              <Button
                variant="ghost"
                onClick={() => { setDate(''); setStatus(''); setPage(1) }}
                className="h-10 px-3 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                <Filter className="size-4 mr-1.5" /> Reset
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
            {STATUS_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const isActive = status === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => { setStatus(opt.value); setPage(1) }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-300 border ${
                    isActive
                      ? `${opt.activeColor} shadow-md shadow-${opt.color.split('-')[1]}-500/20 scale-105`
                      : `bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50 ${opt.color}`
                  }`}
                >
                  <Icon className={`size-3.5 ${isActive ? 'text-white' : ''}`} />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

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
            <div className="space-y-3">
              {appointments.map((appt, idx) => (
                <div key={appt.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm transition-all stagger-item" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md shadow-blue-500/20">
                      {appt.queue_number}
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-bold text-slate-800 truncate">{appt.patient?.user?.full_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 truncate">
                          Dr. {appt.doctor?.user?.full_name}
                        </span>
                        <span className="text-xs text-slate-400 truncate">
                          {appt.doctor?.specialization}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge variant={statusVariant(appt.status)} className="text-xs px-2.5 py-0.5 shadow-sm">
                      {statusLabel(appt.status)}
                    </Badge>
                    <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500 font-medium bg-slate-50 px-2 py-1 rounded-md">
                      <CalendarIcon className="size-3" />
                      {formatDate(appt.appointment_date)}
                      <span className="mx-1 text-slate-300">|</span>
                      <Clock className="size-3" />
                      {appt.schedule?.start_time} – {appt.schedule?.end_time}
                    </div>
                    {appt.status === 'waiting' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setAppointmentToCancel(appt.id)}
                        className="h-7 text-[11px] shadow-sm bg-red-500 hover:bg-red-600 mt-1"
                      >
                        Batalkan Antrian
                      </Button>
                    )}
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

      {/* Custom Cancel Confirmation Modal */}
      {appointmentToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 modal-overlay">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm modal-content p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="size-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Batalkan Antrian?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Apakah Anda yakin ingin membatalkan antrian ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setAppointmentToCancel(null)}
                disabled={cancelMutation.isPending}
              >
                Kembali
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20"
                onClick={() => cancelMutation.mutate(appointmentToCancel)}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : 'Ya, Batalkan'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
