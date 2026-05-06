import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ClipboardList, Loader2, X, Eye, AlertTriangle, Clock, Timer, QrCode } from 'lucide-react'
import { appointmentApi } from '@/api/appointments'
import { toast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import type { Appointment } from '@/types'
import { ratingsApi } from '@/api/ratings'
import StarRating from '@/components/shared/star-rating'

/** Estimate wait time: ~10 minutes per patient ahead */
function getEstimatedWait(appointment: Appointment, allAppointments: Appointment[]): string | null {
  if (appointment.status !== 'waiting') return null
  
  // Get all active appointments for the same doctor on the same date
  const sameQueue = allAppointments.filter(
    a => a.doctor_id === appointment.doctor_id && 
         a.appointment_date === appointment.appointment_date &&
         a.status !== 'cancelled'
  )
  
  // Find current position
  const inProgress = sameQueue.find(a => a.status === 'in_progress')
  const currentNumber = inProgress ? inProgress.queue_number : 0
  const waitingAhead = appointment.queue_number - currentNumber - 1
  
  if (waitingAhead <= 0) return 'Segera dipanggil'
  
  const minutes = waitingAhead * 10
  if (minutes < 60) return `~${minutes} menit`
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `~${hrs} jam ${mins > 0 ? `${mins} menit` : ''}`
}

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

function RatingModal({ appointment, onClose, onSuccess }: { appointment: Appointment; onClose: () => void; onSuccess: () => void }) {
  const [score, setScore] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (score === 0) {
      toast.error('Pilih rating', 'Silakan pilih rating bintang terlebih dahulu')
      return
    }

    setIsSubmitting(true)
    try {
      await ratingsApi.create({
        appointment_id: appointment.id,
        score,
        comment: comment.trim() || undefined,
      })
      toast.success('Rating berhasil dikirim', 'Terima kasih atas feedback Anda!')
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error('Gagal mengirim rating', error.response?.data?.message || 'Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 modal-overlay">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md modal-content">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Beri Rating</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">✕</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-sm text-slate-600 mb-1">Dokter</p>
            <p className="font-semibold text-slate-900">Dr. {appointment.doctor?.user?.full_name}</p>
            <p className="text-xs text-slate-500">{appointment.doctor?.specialization}</p>
          </div>

          <div>
            <p className="text-sm text-slate-600 mb-3">Rating Anda</p>
            <div className="flex justify-center">
              <StarRating rating={score} interactive onChange={setScore} size="lg" />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-2 block">Komentar (opsional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Bagikan pengalaman Anda..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              rows={3}
            />
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button className="flex-1 gradient-primary text-white border-0" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : 'Kirim Rating'}
          </Button>
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
  const [appointmentToRate, setAppointmentToRate] = useState<Appointment | null>(null)
  const [qrAppointment, setQrAppointment] = useState<Appointment | null>(null)
  const [qrImage, setQrImage] = useState<string | null>(null)

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

  const rawAppointments = data?.data?.data ?? []
  const meta = data?.data?.meta
  
  // Sort appointments: waiting/in_progress first (active), then completed/cancelled
  const appointments = [...rawAppointments].sort((a, b) => {
    const statusOrder: Record<string, number> = {
      'waiting': 0,
      'in_progress': 1,
      'completed': 2,
      'cancelled': 3,
    }
    return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99)
  })
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
            <div className="space-y-4">
              {appointments.map((appt, idx) => (
                <div key={appt.id} className="p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-md transition-all stagger-item" style={{ animationDelay: `${idx * 60}ms` }}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md shadow-blue-500/30">
                      {appt.queue_number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-base font-bold text-slate-800">Dr. {appt.doctor?.user?.full_name}</h3>
                          <p className="text-xs font-medium text-slate-500">{appt.doctor?.specialization}</p>
                        </div>
                        <Badge variant={
                          appt.status === 'waiting' ? 'secondary'
                          : appt.status === 'in_progress' ? 'default'
                          : appt.status === 'completed' ? 'outline'
                          : 'destructive'
                        } className="shrink-0">
                          {appt.status === 'waiting' ? 'Menunggu'
                            : appt.status === 'in_progress' ? 'Ditangani'
                            : appt.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                        </Badge>
                      </div>
                      
                      {/* Date & Time */}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg w-fit">
                        <span className="flex items-center gap-1 font-medium text-slate-600">
                          <Clock className="size-3.5 text-primary" />
                          {formatDate(appt.appointment_date)}
                        </span>
                        {appt.schedule && (
                          <>
                            <span className="text-slate-300">|</span>
                            <span className="font-medium">
                              {appt.schedule.start_time} – {appt.schedule.end_time}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Estimated wait time */}
                      {(() => {
                        const est = getEstimatedWait(appt, appointments)
                        if (!est) return null
                        return (
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium mt-2 ${
                            est === 'Segera dipanggil' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            <Timer className="size-3" />
                            {est}
                          </div>
                        )
                      })()}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAppt(appt)}
                          className="h-8 text-xs font-medium bg-white text-slate-600 hover:text-primary hover:bg-blue-50 border-slate-200"
                        >
                          <Eye className="size-3.5 mr-1" /> Detail
                        </Button>
                        {appt.status === 'waiting' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const token = localStorage.getItem('mediqueue-auth')
                                  const authToken = token ? JSON.parse(token).state?.token : ''
                                  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'}/appointments/${appt.id}/qr`, {
                                    headers: {
                                      'Authorization': `Bearer ${authToken}`,
                                    },
                                  })
                                  const blob = await response.blob()
                                  const url = URL.createObjectURL(blob)
                                  setQrImage(url)
                                  setQrAppointment(appt)
                                } catch {
                                  toast.error('Gagal memuat QR code')
                                }
                              }}
                              className="h-8 text-xs bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
                            >
                              <QrCode className="size-3.5 mr-1" /> QR
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setAppointmentToCancel(appt.id)
                              }}
                              disabled={cancelMutation.isPending}
                              className="h-8 text-xs shadow-sm bg-red-500 hover:bg-red-600"
                            >
                              Batalkan
                            </Button>
                          </>
                        )}
                        {appt.status === 'completed' && !appt.medical_record && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setAppointmentToRate(appt)}
                            className="h-8 text-xs gradient-primary text-white border-0 shadow-sm"
                          >
                            ⭐ Rating
                          </Button>
                        )}
                      </div>
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
      {appointmentToRate && (
        <RatingModal
          appointment={appointmentToRate}
          onClose={() => setAppointmentToRate(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['my-appointments'] })
          }}
        />
      )}

      {/* QR Code Modal */}
      {qrAppointment && qrImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 modal-overlay" onClick={() => { setQrAppointment(null); setQrImage(null) }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm modal-content p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
              <QrCode className="size-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">QR Code Check-in</h3>
            <p className="text-sm text-slate-500 mb-4">
              Scan QR ini di resepsionis klinik untuk konfirmasi kedatangan
            </p>
            <div className="bg-white p-4 rounded-xl border-2 border-slate-100 inline-block mb-4">
              <img src={qrImage} alt="QR Code" className="w-48 h-48" />
            </div>
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-600 font-medium">Nomor Antrian</p>
              <p className="text-2xl font-bold text-blue-900">{qrAppointment.queue_number}</p>
            </div>
            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => { setQrAppointment(null); setQrImage(null) }}
            >
              Tutup
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
