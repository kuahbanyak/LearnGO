import { useQuery } from '@tanstack/react-query'
import { Calendar, CheckCircle, Clock, UserCheck, Loader2, ArrowRight, Activity, Stethoscope } from 'lucide-react'
import { dashboardApi } from '@/api/dashboard'
import { appointmentApi } from '@/api/appointments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'
import { formatDate } from '@/lib/utils'
import { Link } from 'react-router-dom'

export default function DoctorDashboard() {
  const { user } = useAuthStore()

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['doctor-stats'],
    queryFn: () => dashboardApi.getDoctorStats(),
    refetchInterval: 15000,
    staleTime: 5000,
  })

  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ['today-queue'],
    queryFn: () => appointmentApi.getTodayQueue(),
    refetchInterval: 10000,
    staleTime: 5000,
  })

  const stats = statsData?.data?.data
  const queue = queueData?.data?.data ?? []

  const statCards = [
    { title: 'Total Antrian Hari Ini', value: stats?.today_queue ?? 0, icon: Calendar, gradient: 'gradient-primary', shadow: 'shadow-blue-500/25' },
    { title: 'Sedang Menunggu', value: stats?.waiting_now ?? 0, icon: Clock, gradient: 'bg-gradient-to-br from-amber-500 to-yellow-600', shadow: 'shadow-amber-500/25' },
    { title: 'Sedang Ditangani', value: stats?.today_visits ?? 0, icon: UserCheck, gradient: 'gradient-warning', shadow: 'shadow-orange-500/25' },
    { title: 'Selesai', value: stats?.completed_today ?? 0, icon: CheckCircle, gradient: 'gradient-success', shadow: 'shadow-emerald-500/25' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white"
        style={{ background: 'linear-gradient(135deg, hsl(152 69% 35%) 0%, hsl(166 72% 35%) 50%, hsl(180 70% 32%) 100%)' }}>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-emerald-100 text-sm mb-1">🩺 Selamat datang,</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{user?.full_name}</h1>
            <p className="text-emerald-200 mt-2 text-sm">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Button asChild className="bg-white text-emerald-700 hover:bg-white/90 border-0 rounded-xl shadow-lg font-semibold">
            <Link to="/doctor/queue">
              <Stethoscope className="size-4 mr-1.5" />
              Mulai Praktik
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ title, value, icon: Icon, gradient, shadow }, index) => (
          <div key={title} className="stagger-item" style={{ animationDelay: `${index * 80}ms` }}>
            <Card className="card-hover border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-slate-500">{title}</p>
                    {statsLoading ? (
                      <div className="h-8 w-14 skeleton mt-2 rounded-lg" />
                    ) : (
                      <p className="text-2xl font-bold mt-1 text-slate-900 number-animate">{value}</p>
                    )}
                  </div>
                  <div className={`p-2.5 rounded-xl ${gradient} shadow-lg ${shadow}`}>
                    <Icon className="size-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Today's Queue */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50">
              <Activity className="size-4 text-blue-500" />
            </div>
            Antrian Hari Ini
            {stats?.waiting_now !== undefined && stats.waiting_now > 0 && (
              <span className="px-2.5 py-0.5 text-[11px] bg-amber-100 text-amber-700 rounded-full font-semibold">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mr-1 dot-pulse" />
                {stats.waiting_now} menunggu
              </span>
            )}
          </CardTitle>
          <Button variant="outline" size="sm" asChild className="rounded-lg text-xs">
            <Link to="/doctor/queue">
              Kelola Antrian <ArrowRight className="size-3 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {queueLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl">
                  <div className="w-9 h-9 rounded-full skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-28 skeleton rounded" />
                    <div className="h-3 w-20 skeleton rounded" />
                  </div>
                  <div className="h-6 w-16 skeleton rounded-full" />
                </div>
              ))}
            </div>
          ) : queue.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Calendar className="size-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">Tidak ada antrian hari ini</p>
              <p className="text-xs mt-1">Antrian akan muncul saat pasien mendaftar</p>
            </div>
          ) : (
            <div className="space-y-2">
              {queue.slice(0, 5).map((appt, index) => (
                <div key={appt.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all stagger-item"
                  style={{ animationDelay: `${index * 60}ms` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/20">
                      {appt.queue_number}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{appt.patient?.user?.full_name}</p>
                      <p className="text-[11px] text-slate-400">{formatDate(appt.appointment_date)}</p>
                    </div>
                  </div>
                  <Badge variant={
                    appt.status === 'waiting' ? 'secondary'
                    : appt.status === 'in_progress' ? 'default'
                    : appt.status === 'completed' ? 'outline'
                    : 'destructive'
                  } className="text-[11px]">
                    {appt.status === 'waiting' ? 'Menunggu'
                      : appt.status === 'in_progress' ? 'Ditangani'
                      : appt.status === 'completed' ? 'Selesai' : 'Batal'}
                  </Badge>
                </div>
              ))}
              {queue.length > 5 && (
                <p className="text-xs text-center text-slate-400 pt-2">
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
