import { useQuery } from '@tanstack/react-query'
import { Calendar, CheckCircle, Clock, UserCheck, Loader2 } from 'lucide-react'
import { dashboardApi } from '@/api/dashboard'
import { appointmentApi } from '@/api/appointments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/auth-store'
import { formatDate } from '@/lib/utils'

export default function DoctorDashboard() {
  const { user } = useAuthStore()

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['doctor-stats'],
    queryFn: () => dashboardApi.getDoctorStats(),
    refetchInterval: 15000,
  })

  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ['today-queue'],
    queryFn: () => appointmentApi.getTodayQueue(),
    refetchInterval: 10000,
  })

  const stats = statsData?.data?.data
  const queue = queueData?.data?.data ?? []

  const statCards = [
    { title: 'Total Antrian Hari Ini', value: stats?.today_queue ?? 0, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Sedang Menunggu', value: stats?.waiting_now ?? 0, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { title: 'Sedang Ditangani', value: stats?.today_visits ?? 0, icon: UserCheck, color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Selesai', value: stats?.completed_today ?? 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Dokter</h1>
        <p className="text-muted-foreground mt-1">Selamat datang, {user?.full_name}!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ title, value, icon: Icon, color, bg }) => (
          <Card key={title}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{title}</p>
                  {statsLoading
                    ? <Loader2 className="size-4 animate-spin mt-1" />
                    : <p className="text-2xl font-bold mt-0.5">{value}</p>
                  }
                </div>
                <div className={`p-2.5 rounded-xl ${bg}`}>
                  <Icon className={`size-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Antrian Hari Ini</CardTitle>
        </CardHeader>
        <CardContent>
          {queueLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : queue.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="size-10 mx-auto mb-3 opacity-30" />
              <p>Tidak ada antrian hari ini</p>
            </div>
          ) : (
            <div className="space-y-2">
              {queue.slice(0, 5).map((appt) => (
                <div key={appt.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {appt.queue_number}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{appt.patient?.user?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(appt.appointment_date)}</p>
                    </div>
                  </div>
                  <Badge variant={
                    appt.status === 'waiting' ? 'secondary'
                    : appt.status === 'in_progress' ? 'default'
                    : appt.status === 'completed' ? 'outline'
                    : 'destructive'
                  }>
                    {appt.status === 'waiting' ? 'Menunggu'
                      : appt.status === 'in_progress' ? 'Ditangani'
                      : appt.status === 'completed' ? 'Selesai' : 'Batal'}
                  </Badge>
                </div>
              ))}
              {queue.length > 5 && (
                <p className="text-xs text-center text-muted-foreground pt-2">
                  Dan {queue.length - 5} antrian lainnya...
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
