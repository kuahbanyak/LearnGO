import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, ChevronRight, CheckCircle, UserCheck } from 'lucide-react'
import { appointmentApi } from '@/api/appointments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Appointment } from '@/types'
import { useState } from 'react'
import MedicalRecordForm from './medical-record-form.tsx'

export default function DoctorQueuePage() {
  const queryClient = useQueryClient()
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showForm, setShowForm] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['today-queue'],
    queryFn: () => appointmentApi.getTodayQueue(),
    refetchInterval: 10000,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      appointmentApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-queue'] })
      queryClient.invalidateQueries({ queryKey: ['doctor-stats'] })
    },
  })

  const queue = data?.data?.data ?? []
  const waiting = queue.filter(a => a.status === 'waiting')
  const inProgress = queue.filter(a => a.status === 'in_progress')
  const completed = queue.filter(a => a.status === 'completed')

  const callNext = () => {
    if (waiting.length > 0 && inProgress.length === 0) {
      statusMutation.mutate({ id: waiting[0].id, status: 'in_progress' })
    }
  }

  const complete = (id: string, appt: Appointment) => {
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
          queryClient.invalidateQueries({ queryKey: ['today-queue'] })
          statusMutation.mutate({ id: selectedAppointment.id, status: 'completed' })
        }}
        onBack={() => setShowForm(false)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Antrian Hari Ini</h1>
          <p className="text-muted-foreground mt-1">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <Button
          onClick={callNext}
          disabled={waiting.length === 0 || inProgress.length > 0 || statusMutation.isPending}
          className="gradient-primary text-white border-0"
        >
          {statusMutation.isPending
            ? <Loader2 className="size-4 animate-spin" />
            : <ChevronRight className="size-4" />}
          Panggil Berikutnya
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Waiting */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
                Menunggu ({waiting.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {waiting.map(a => (
                <AppointmentCard key={a.id} appt={a} />
              ))}
              {waiting.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Tidak ada</p>}
            </CardContent>
          </Card>

          {/* In Progress */}
          <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="size-4 text-blue-600" />
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
                    className="w-full mt-2 gradient-primary text-white border-0 text-xs"
                  >
                    Selesai & Buat Rekam Medis
                  </Button>
                </div>
              ))}
              {inProgress.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Tidak ada</p>}
            </CardContent>
          </Card>

          {/* Completed */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="size-4 text-green-600" />
                Selesai ({completed.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {completed.slice(0, 5).map(a => (
                <AppointmentCard key={a.id} appt={a} />
              ))}
              {completed.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Belum ada</p>}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function AppointmentCard({ appt }: { appt: Appointment }) {
  return (
    <div className="p-3 rounded-lg bg-white border flex items-center gap-3">
      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-xs shrink-0">
        {appt.queue_number}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{appt.patient?.user?.full_name}</p>
        <p className="text-xs text-muted-foreground">No. {appt.queue_number}</p>
      </div>
      <Badge variant={
        appt.status === 'waiting' ? 'secondary'
        : appt.status === 'in_progress' ? 'default'
        : 'outline'
      } className="ml-auto shrink-0 text-xs">
        {appt.status === 'waiting' ? 'Tunggu'
          : appt.status === 'in_progress' ? 'Ditangani' : 'Selesai'}
      </Badge>
    </div>
  )
}
