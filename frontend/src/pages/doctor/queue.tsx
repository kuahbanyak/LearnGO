import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, ChevronRight, CheckCircle, UserCheck, Clock, Users, ArrowRight } from 'lucide-react'
import { appointmentApi } from '@/api/appointments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Appointment } from '@/types'
import { useState } from 'react'
import { toast } from '@/hooks/use-toast'
import MedicalRecordForm from './medical-record-form.tsx'

/** Hitung estimasi waktu tunggu: asumsi 10 menit per pasien */
function getEstimatedTime(queueNumber: number, currentInProgressQueue: number, startTime: string): string {
  const waitingAhead = queueNumber - currentInProgressQueue - 1
  if (waitingAhead <= 0) return 'Segera dipanggil'
  const minutesAhead = waitingAhead * 10

  if (!startTime) return `~${minutesAhead} menit`

  const [h, m] = startTime.split(':').map(Number)
  const start = new Date()
  start.setHours(h, m, 0, 0)
  start.setMinutes(start.getMinutes() + minutesAhead)
  return `~${start.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
}

export default function DoctorQueuePage() {
  const queryClient = useQueryClient()
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showForm, setShowForm] = useState(false)

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })

  const { data, isLoading } = useQuery({
    queryKey: ['today-queue', selectedDate],
    queryFn: () => appointmentApi.getTodayQueue(selectedDate),
    refetchInterval: 10000,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      appointmentApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
      if (variables.status === 'in_progress') toast.success('Pasien dipanggil', 'Pasien sedang ditangani.')
      if (variables.status === 'completed') toast.success('Kunjungan selesai', 'Rekam medis telah disimpan.')
      queryClient.invalidateQueries({ queryKey: ['today-queue', selectedDate] })
      queryClient.invalidateQueries({ queryKey: ['doctor-stats'] })
    },
    onError: () => toast.error('Gagal memperbarui status antrian'),
  })

  const queue = data?.data?.data ?? []
  const waiting = queue.filter(a => a.status === 'waiting')
  const inProgress = queue.filter(a => a.status === 'in_progress')
  const completed = queue.filter(a => a.status === 'completed')

  // Nomor antrian yang sedang ditangani (untuk estimasi)
  const currentInProgressNumber = inProgress.length > 0 ? inProgress[0].queue_number : 0
  const scheduleStartTime = queue.length > 0 ? queue[0].schedule?.start_time ?? '' : ''

  const callNext = () => {
    if (waiting.length > 0 && inProgress.length === 0) {
      statusMutation.mutate({ id: waiting[0].id, status: 'in_progress' })
    }
  }

  const complete = (_id: string, appt: Appointment) => {
    setSelectedAppointment(appt)
    setShowForm(true)
  }

  if (showForm && selectedAppointment) {
    return (
      <MedicalRecordForm
        appointment={selectedAppointment}
        onDone={() => {
          setShowForm(false)
          setSelectedAppointment(null)
          queryClient.invalidateQueries({ queryKey: ['today-queue', selectedDate] })
          statusMutation.mutate({ id: selectedAppointment.id, status: 'completed' })
        }}
        onBack={() => setShowForm(false)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Antrian Pasien</h1>
          <div className="flex items-center gap-3 mt-2">
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm"
            />
            <p className="text-slate-500 text-sm">
              {new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <Button
          onClick={callNext}
          disabled={waiting.length === 0 || inProgress.length > 0 || statusMutation.isPending}
          className="gradient-primary text-white border-0 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all font-semibold"
          size="lg"
        >
          {statusMutation.isPending
            ? <Loader2 className="size-4 animate-spin" />
            : <ChevronRight className="size-4" />}
          Panggil Berikutnya
        </Button>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Menunggu', count: waiting.length, gradient: 'bg-gradient-to-br from-amber-500 to-yellow-600', shadow: 'shadow-amber-500/25', icon: Clock, dotColor: 'bg-amber-400' },
          { label: 'Ditangani', count: inProgress.length, gradient: 'gradient-primary', shadow: 'shadow-blue-500/25', icon: UserCheck, dotColor: 'bg-blue-400' },
          { label: 'Selesai', count: completed.length, gradient: 'gradient-success', shadow: 'shadow-emerald-500/25', icon: CheckCircle, dotColor: 'bg-emerald-400' },
        ].map(({ label, count, gradient, shadow, icon: Icon }, index) => (
          <div key={label} className="stagger-item" style={{ animationDelay: `${index * 80}ms` }}>
            <Card className="card-hover border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${gradient} shadow-lg ${shadow}`}>
                  <Icon className="size-4 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 number-animate">{count}</p>
                  <p className="text-[11px] text-slate-400 font-medium">{label}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="h-5 w-32 skeleton rounded" />
              </CardHeader>
              <CardContent className="space-y-2">
                {[...Array(2)].map((_, j) => (
                  <div key={j} className="flex items-center gap-3 p-3">
                    <div className="w-9 h-9 rounded-full skeleton" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-24 skeleton rounded" />
                      <div className="h-3 w-16 skeleton rounded" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menunggu */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 dot-pulse" />
                Menunggu ({waiting.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {waiting.map((a, index) => (
                <div key={a.id} className="stagger-item" style={{ animationDelay: `${index * 60}ms` }}>
                  <AppointmentCard
                    appt={a}
                    estimatedTime={getEstimatedTime(a.queue_number, currentInProgressNumber, scheduleStartTime)}
                  />
                </div>
              ))}
              {waiting.length === 0 && (
                <div className="flex flex-col items-center py-8 text-slate-400">
                  <Users className="size-10 mb-3 opacity-20" />
                  <p className="text-sm font-medium">Tidak ada antrian menunggu</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sedang Ditangani */}
          <Card className="border-0 shadow-sm ring-2 ring-blue-100 bg-blue-50/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-1 rounded-md bg-blue-100">
                  <UserCheck className="size-3.5 text-blue-600" />
                </div>
                Sedang Ditangani ({inProgress.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {inProgress.map(a => (
                <div key={a.id}>
                  <AppointmentCard appt={a} />
                  <Button
                    size="sm"
                    onClick={() => complete(a.id, a)}
                    className="w-full mt-2 gradient-primary text-white border-0 text-xs rounded-xl shadow-md shadow-blue-500/20 font-semibold"
                  >
                    <CheckCircle className="size-3 mr-1" />
                    Selesai & Buat Rekam Medis
                  </Button>
                </div>
              ))}
              {inProgress.length === 0 && (
                <div className="flex flex-col items-center py-8 text-slate-400">
                  <UserCheck className="size-10 mb-3 opacity-20" />
                  <p className="text-sm text-center font-medium">Klik "Panggil Berikutnya"<br/>untuk mulai menangani pasien</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selesai */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-1 rounded-md bg-emerald-100">
                  <CheckCircle className="size-3.5 text-emerald-600" />
                </div>
                Selesai ({completed.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {completed.slice(0, 6).map((a, index) => (
                <div key={a.id} className="stagger-item" style={{ animationDelay: `${index * 50}ms` }}>
                  <AppointmentCard appt={a} />
                </div>
              ))}
              {completed.length > 6 && (
                <p className="text-xs text-center text-slate-400 pt-1">
                  +{completed.length - 6} kunjungan lainnya
                </p>
              )}
              {completed.length === 0 && <p className="text-sm text-slate-400 text-center py-6">Belum ada</p>}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function AppointmentCard({ appt, estimatedTime }: { appt: Appointment; estimatedTime?: string }) {
  return (
    <div className="p-3.5 rounded-xl bg-white border border-slate-100 flex items-center gap-3 hover:shadow-sm hover:border-slate-200 transition-all">
      <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md shadow-blue-500/20">
        {appt.queue_number}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800 truncate">{appt.patient?.user?.full_name}</p>
        {estimatedTime && appt.status === 'waiting' && (
          <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1">
            <Clock className="size-2.5" />
            {estimatedTime}
          </p>
        )}
        {appt.status === 'in_progress' && appt.checked_in_at && (
          <p className="text-[11px] text-blue-600 font-medium">
            Masuk: {new Date(appt.checked_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
        {appt.status === 'completed' && appt.completed_at && (
          <p className="text-[11px] text-emerald-600">
            Selesai: {new Date(appt.completed_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
      <Badge variant={
        appt.status === 'waiting' ? 'secondary'
        : appt.status === 'in_progress' ? 'default'
        : 'outline'
      } className="ml-auto shrink-0 text-[11px]">
        {appt.status === 'waiting' ? 'Tunggu'
          : appt.status === 'in_progress' ? 'Ditangani' : 'Selesai'}
      </Badge>
    </div>
  )
}
