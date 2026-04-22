import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ClipboardList, Loader2, X, Eye, AlertTriangle } from 'lucide-react'
import { appointmentApi } from '@/api/appointments'
import { toast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import type { Appointment } from '@/types'

function AppointmentDetailModal({ appointment, onClose }: { appointment: Appointment; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 modal-overlay">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md modal-content">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Detail Antrian</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">✕</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white text-xl font-bold">
              {appointment.queue_number}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">No. Antrian</p>
              <p className="text-lg font-bold text-slate-900">#{appointment.queue_number}</p>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { label: 'Dokter', value: appointment.doctor?.user?.full_name },
              { label: 'Spesialisasi', value: appointment.doctor?.specialization },
              { label: 'Tanggal', value: formatDate(appointment.appointment_date) },
              { label: 'Jam Praktek', value: appointment.schedule ? `${appointment.schedule.start_time} – ${appointment.schedule.end_time}` : '-' },
              { label: 'Status', value: null },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b last:border-0">
                <span className="text-sm text-muted-foreground">{label}</span>
                {label === 'Status' ? (
                  <Badge variant={
                    appointment.status === 'waiting' ? 'secondary'
                    : appointment.status === 'in_progress' ? 'default'
                    : appointment.status === 'completed' ? 'outline'
                    : 'destructive'
                  }>
                    {appointment.status === 'waiting' ? 'Menunggu'
                      : appointment.status === 'in_progress' ? 'Ditangani'
                      : appointment.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                  </Badge>
                ) : (
                  <span className="text-sm font-medium">{value}</span>
                )}
              </div>
            ))}
          </div>

          {appointment.cancel_reason && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-xs text-red-600 font-medium">Alasan Pembatalan</p>
              <p className="text-sm mt-0.5">{appointment.cancel_reason}</p>
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

export default function MyQueuePage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null)
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['my-appointments', page],
    queryFn: () => appointmentApi.getMy({ page, per_page: 10 }),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => appointmentApi.cancel(id),
    onSuccess: () => {
      toast.success('Antrian berhasil dibatalkan')
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] })
      setAppointmentToCancel(null)
    },
    onError: () => toast.error('Gagal membatalkan antrian'),
  })

  const appointments = data?.data?.data ?? []
  const meta = data?.data?.meta
  const totalPages = meta?.total_pages ?? 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Antrian Saya</h1>
        <p className="text-slate-500 mt-1">Riwayat dan status antrian kunjungan Anda</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="size-4" />
            {meta ? `${meta.total} antrian` : 'Antrian Saya'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="size-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">Belum ada antrian</p>
              <p className="text-xs mt-1">Daftarkan antrian pertama Anda sekarang</p>
              <Button asChild className="mt-4 gradient-primary text-white border-0" size="sm">
                <a href="/patient/book">Daftar Antrian</a>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {appointments.map(appt => (
                <div key={appt.id} className="py-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm shrink-0 mt-0.5">
                      {appt.queue_number}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{appt.doctor?.user?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{appt.doctor?.specialization}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(appt.appointment_date)}</p>
                      {appt.schedule && (
                        <p className="text-xs text-muted-foreground">
                          {appt.schedule.start_time} – {appt.schedule.end_time}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge variant={
                      appt.status === 'waiting' ? 'secondary'
                      : appt.status === 'in_progress' ? 'default'
                      : appt.status === 'completed' ? 'outline'
                      : 'destructive'
                    }>
                      {appt.status === 'waiting' ? 'Menunggu'
                        : appt.status === 'in_progress' ? 'Ditangani'
                        : appt.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                    </Badge>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setSelectedAppt(appt)}
                        className="p-1.5 rounded text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Detail"
                      >
                        <Eye className="size-3.5" />
                      </button>
                      {appt.status === 'waiting' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setAppointmentToCancel(appt.id)
                          }}
                          disabled={cancelMutation.isPending}
                          className="rounded-lg shadow-sm ml-1"
                        >
                          Batal
                        </Button>
                      )}
                    </div>
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

      {selectedAppt && (
        <AppointmentDetailModal appointment={selectedAppt} onClose={() => setSelectedAppt(null)} />
      )}

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
                className="flex-1 rounded-xl"
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
