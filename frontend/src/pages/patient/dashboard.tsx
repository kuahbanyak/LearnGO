import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, Clock, Loader2, X } from 'lucide-react'
import { dashboardApi } from '@/api/dashboard'
import { appointmentApi } from '@/api/appointments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'
import { formatDate } from '@/lib/utils'

export default function PatientDashboard() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['patient-stats'],
    queryFn: () => dashboardApi.getPatientStats(),
    refetchInterval: 30000,
  })

  const { data: apptData, isLoading: apptLoading } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: () => appointmentApi.getMy({ per_page: 5 }),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => appointmentApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['patient-stats'] })
    },
  })

  const stats = statsData?.data?.data
  const appointments = apptData?.data?.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Pasien</h1>
        <p className="text-muted-foreground mt-1">Selamat datang, {user?.full_name}!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-xs text-muted-foreground font-medium">Antrian Aktif</p>
            {statsLoading ? <Loader2 className="size-4 animate-spin mx-auto mt-1" />
              : <p className="text-3xl font-bold mt-1 text-blue-600">{stats?.waiting_now ?? 0}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-xs text-muted-foreground font-medium">Total Booking</p>
            {statsLoading ? <Loader2 className="size-4 animate-spin mx-auto mt-1" />
              : <p className="text-3xl font-bold mt-1">{stats?.today_queue ?? 0}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-xs text-muted-foreground font-medium">Kunjungan Selesai</p>
            {statsLoading ? <Loader2 className="size-4 animate-spin mx-auto mt-1" />
              : <p className="text-3xl font-bold mt-1 text-green-600">{stats?.completed_today ?? 0}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Recent Appointments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Antrian Terbaru</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <a href="/patient/book">+ Daftar Antrian</a>
          </Button>
        </CardHeader>
        <CardContent>
          {apptLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="size-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Belum ada antrian. Daftar sekarang!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((appt) => (
                <div key={appt.id} className="flex items-center justify-between p-4 rounded-lg border bg-slate-50">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold shrink-0">
                      {appt.queue_number}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{appt.doctor?.user?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{appt.doctor?.specialization}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="size-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{formatDate(appt.appointment_date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      appt.status === 'waiting' ? 'secondary'
                      : appt.status === 'in_progress' ? 'default'
                      : appt.status === 'completed' ? 'outline'
                      : 'destructive'
                    }>
                      {appt.status === 'waiting' ? 'Menunggu'
                        : appt.status === 'in_progress' ? 'Ditangani'
                        : appt.status === 'completed' ? 'Selesai' : 'Dibatal'}
                    </Badge>
                    {appt.status === 'waiting' && (
                      <button
                        onClick={() => cancelMutation.mutate(appt.id)}
                        disabled={cancelMutation.isPending}
                        className="p-1 text-red-400 hover:text-red-600 transition-colors"
                        title="Batalkan"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
