import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, Clock, Loader2, ArrowRight, Activity, CheckCircle, Stethoscope, AlertTriangle, Sparkles } from 'lucide-react'
import { dashboardApi } from '@/api/dashboard'
import { appointmentApi } from '@/api/appointments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'
import { formatDate } from '@/lib/utils'
import { Link } from 'react-router-dom'

export default function PatientDashboard() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null)

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
      setAppointmentToCancel(null)
    },
  })

  const stats = statsData?.data?.data
  const appointments = apptData?.data?.data ?? []
  
  const sortedAppointments = [...appointments].sort((a, b) => {
    const aActive = a.status === 'waiting' || a.status === 'in_progress' ? 0 : 1
    const bActive = b.status === 'waiting' || b.status === 'in_progress' ? 0 : 1
    if (aActive !== bActive) return aActive - bActive
    return new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
  })

  const statCards = [
    { 
      title: 'Antrian Aktif', 
      value: stats?.waiting_now ?? 0, 
      icon: Activity, 
      gradient: 'gradient-primary', 
      shadow: 'shadow-sky-500/20',
    },
    { 
      title: 'Total Booking', 
      value: stats?.today_queue ?? 0, 
      icon: Calendar, 
      gradient: 'gradient-ocean', 
      shadow: 'shadow-cyan-500/20',
    },
    { 
      title: 'Selesai', 
      value: stats?.completed_today ?? 0, 
      icon: CheckCircle, 
      gradient: 'gradient-success', 
      shadow: 'shadow-emerald-500/20',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl gradient-primary p-6 sm:p-8 text-white">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-12 w-56 h-56 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute top-4 right-4 opacity-20">
          <Sparkles className="size-8" />
        </div>
        <div className="relative z-10">
          <p className="text-sky-100 text-sm font-medium mb-1">Selamat datang kembali,</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{user?.full_name}</h1>
          <p className="text-sky-200/80 mt-2 text-sm max-w-md">
            Kelola antrian dan lihat riwayat medis Anda dengan mudah.
          </p>
          <Button asChild className="mt-5 bg-white text-primary hover:bg-white/90 border-0 shadow-lg font-semibold">
            <Link to="/patient/book">
              <Calendar className="size-4 mr-2" />
              Daftar Antrian Baru
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map(({ title, value, icon: Icon, gradient, shadow }, index) => (
          <div key={title} className="stagger-item" style={{ animationDelay: `${index * 80}ms` }}>
            <Card className="card-hover border-0 shadow-sm overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] text-slate-500 font-medium">{title}</p>
                    {statsLoading ? (
                      <div className="h-9 w-14 skeleton mt-2 rounded-lg" />
                    ) : (
                      <p className="text-3xl font-bold mt-1 text-slate-900 number-animate">{value}</p>
                    )}
                  </div>
                  <div className={`p-3.5 rounded-xl ${gradient} shadow-lg ${shadow}`}>
                    <Icon className="size-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Daftar Antrian', desc: 'Pilih dokter & jadwal', href: '/patient/book', icon: Calendar, gradient: 'from-sky-500 to-blue-600', bg: 'bg-sky-50 hover:bg-sky-100 border-sky-200' },
          { label: 'Antrian Saya', desc: 'Pantau status antrian', href: '/patient/my-queue', icon: Stethoscope, gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-50 hover:bg-violet-100 border-violet-200' },
          { label: 'Riwayat Medis', desc: 'Lihat rekam medis', href: '/patient/medical-history', icon: Activity, gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200' },
        ].map(({ label, desc, href, icon: Icon, gradient, bg }) => (
          <Link key={href} to={href}
            className={`flex items-center gap-4 p-4 rounded-xl border ${bg} transition-all group`}>
            <div className={`p-2.5 rounded-xl bg-linear-to-br ${gradient} shadow-sm`}>
              <Icon className="size-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">{label}</p>
              <p className="text-[11px] text-slate-500">{desc}</p>
            </div>
            <ArrowRight className="size-4 text-slate-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </Link>
        ))}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-50">
              <Clock className="size-4 text-orange-500" />
            </div>
            Antrian Terbaru
          </CardTitle>
          <Button variant="ghost" size="sm" asChild className="text-xs text-slate-500 hover:text-primary">
            <Link to="/patient/book">+ Daftar Antrian</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {apptLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4">
                  <div className="w-11 h-11 rounded-full skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-28 skeleton rounded" />
                    <div className="h-3 w-40 skeleton rounded" />
                  </div>
                  <div className="h-6 w-16 skeleton rounded-full" />
                </div>
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Calendar className="size-14 mx-auto mb-4 opacity-20" />
              <p className="text-sm font-medium">Belum ada antrian</p>
              <p className="text-xs mt-1">Daftar antrian pertama Anda sekarang!</p>
              <Button asChild className="mt-5" size="sm">
                <Link to="/patient/book">Daftar Sekarang</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedAppointments.map((appt, index) => (
                <div key={appt.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all stagger-item"
                  style={{ animationDelay: `${index * 60}ms` }}>
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center text-white font-bold shrink-0 shadow-md shadow-sky-500/20">
                      {appt.queue_number}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{appt.doctor?.user?.full_name}</p>
                      <p className="text-[11px] text-slate-400">{appt.doctor?.specialization}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="size-3 text-slate-300" />
                        <span className="text-[11px] text-slate-400">{formatDate(appt.appointment_date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      appt.status === 'waiting' ? 'secondary'
                      : appt.status === 'in_progress' ? 'default'
                      : appt.status === 'completed' ? 'outline'
                      : 'destructive'
                    } className="text-[11px]">
                      {appt.status === 'waiting' ? 'Menunggu'
                        : appt.status === 'in_progress' ? 'Ditangani'
                        : appt.status === 'completed' ? 'Selesai' : 'Dibatal'}
                    </Badge>
                    {appt.status === 'waiting' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setAppointmentToCancel(appt.id)
                        }}
                        disabled={cancelMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg text-xs"
                      >
                        Batal
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {appointmentToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 modal-overlay">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm modal-content p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="size-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Batalkan Antrian?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setAppointmentToCancel(null)}
                disabled={cancelMutation.isPending}
              >
                Kembali
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
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
