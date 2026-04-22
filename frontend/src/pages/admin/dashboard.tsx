import { useQuery } from '@tanstack/react-query'
import { Users, UserCog, Calendar, Clock, CheckCircle, Loader2, ArrowRight, TrendingUp, Activity } from 'lucide-react'
import { dashboardApi } from '@/api/dashboard'
import { appointmentApi } from '@/api/appointments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { DashboardStats } from '@/types'
import { formatDate } from '@/lib/utils'
import { Link } from 'react-router-dom'

interface StatCardProps {
  title: string
  value: number | undefined
  icon: React.ElementType
  gradient: string
  shadowColor: string
  loading: boolean
  trend?: string
  index: number
}

function StatCard({ title, value, icon: Icon, gradient, shadowColor, loading, trend, index }: StatCardProps) {
  return (
    <div className="stagger-item" style={{ animationDelay: `${index * 80}ms` }}>
      <Card className="overflow-hidden card-hover border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-[13px] font-medium text-slate-500">{title}</p>
              {loading ? (
                <div className="h-9 w-20 skeleton mt-2 rounded-lg" />
              ) : (
                <p className="text-3xl font-bold mt-1.5 text-slate-900 number-animate">{value ?? 0}</p>
              )}
              {trend && <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1"><TrendingUp className="size-3" />{trend}</p>}
            </div>
            <div className={`p-3 rounded-xl ${gradient} shadow-lg ${shadowColor}`}>
              <Icon className="size-5 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function statusLabel(s: string) {
  if (s === 'waiting') return 'Menunggu'
  if (s === 'in_progress') return 'Ditangani'
  if (s === 'completed') return 'Selesai'
  return 'Dibatalkan'
}

function statusVariant(s: string): 'secondary' | 'default' | 'outline' | 'destructive' {
  if (s === 'waiting') return 'secondary'
  if (s === 'in_progress') return 'default'
  if (s === 'cancelled') return 'destructive'
  return 'outline'
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => dashboardApi.getAdminStats(),
    refetchInterval: 30000,
  })

  // Ambil antrian hari ini (status waiting + in_progress)
  const d = new Date()
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const { data: todayData, isLoading: todayLoading } = useQuery({
    queryKey: ['appointments-today-admin', today],
    queryFn: () => appointmentApi.getAll({ page: 1, per_page: 8, date: today }),
    refetchInterval: 15000,
  })

  const stats: DashboardStats | undefined = data?.data?.data
  const todayAppointments = todayData?.data?.data ?? []

  const cards = [
    { title: 'Total Pasien', value: stats?.total_patients, icon: Users, gradient: 'gradient-primary', shadowColor: 'shadow-blue-500/25', trend: 'Pasien terdaftar' },
    { title: 'Dokter Aktif', value: stats?.active_doctors, icon: UserCog, gradient: 'gradient-purple', shadowColor: 'shadow-purple-500/25', trend: 'Dokter bertugas' },
    { title: 'Antrian Hari Ini', value: stats?.today_queue, icon: Calendar, gradient: 'gradient-warning', shadowColor: 'shadow-orange-500/25', trend: 'Total antrian hari ini' },
    { title: 'Sedang Menunggu', value: stats?.waiting_now, icon: Clock, gradient: 'bg-gradient-to-br from-amber-500 to-yellow-600', shadowColor: 'shadow-amber-500/25', trend: 'Belum dipanggil' },
    { title: 'Selesai Hari Ini', value: stats?.completed_today, icon: CheckCircle, gradient: 'gradient-success', shadowColor: 'shadow-emerald-500/25', trend: 'Kunjungan selesai' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Dashboard Admin</h1>
          <p className="text-slate-500 mt-1">
            Ringkasan klinik,{' '}
            <span className="font-medium text-slate-700">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
          <Activity className="size-3.5 text-emerald-600" />
          <span className="text-xs font-medium text-emerald-700">Sistem Online</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card, index) => (
          <StatCard key={card.title} {...card} loading={isLoading} index={index} />
        ))}
      </div>

      {/* Antrian Hari Ini & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Antrian Real-time */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-50">
                <Clock className="size-4 text-orange-500" />
              </div>
              Antrian Hari Ini
              {stats?.waiting_now !== undefined && stats.waiting_now > 0 && (
                <span className="ml-1 px-2.5 py-0.5 text-[11px] bg-orange-100 text-orange-700 rounded-full font-semibold">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500 mr-1 dot-pulse" />
                  {stats.waiting_now} menunggu
                </span>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs text-slate-400 hover:text-primary">
              <Link to="/admin/appointments">
                Lihat Semua <ArrowRight className="size-3 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {todayLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <div className="w-10 h-10 rounded-full skeleton" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-32 skeleton rounded" />
                      <div className="h-3 w-48 skeleton rounded" />
                    </div>
                    <div className="h-6 w-16 skeleton rounded-full" />
                  </div>
                ))}
              </div>
            ) : todayAppointments.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Calendar className="size-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Tidak ada antrian hari ini</p>
                <p className="text-xs mt-1">Antrian akan muncul saat pasien mendaftar</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {todayAppointments.map((appt, index) => (
                  <div key={appt.id}
                    className="flex items-center justify-between py-3.5 gap-4 stagger-item hover:bg-slate-50/50 -mx-2 px-2 rounded-lg transition-colors"
                    style={{ animationDelay: `${index * 60}ms` }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md shadow-blue-500/20">
                        {appt.queue_number}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{appt.patient?.user?.full_name}</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {appt.doctor?.user?.full_name} · {appt.doctor?.specialization}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <p className="text-[11px] text-slate-400 hidden sm:block">
                        {appt.schedule?.start_time} – {appt.schedule?.end_time}
                      </p>
                      <Badge variant={statusVariant(appt.status)} className="text-[11px]">
                        {statusLabel(appt.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'Tambah Dokter', href: '/admin/doctors', gradient: 'from-blue-50 to-blue-100/50', hoverGrad: 'hover:from-blue-100 hover:to-blue-200/50', textColor: 'text-blue-700', icon: UserCog, iconBg: 'bg-blue-500' },
              { label: 'Atur Jadwal', href: '/admin/schedules', gradient: 'from-purple-50 to-purple-100/50', hoverGrad: 'hover:from-purple-100 hover:to-purple-200/50', textColor: 'text-purple-700', icon: Calendar, iconBg: 'bg-purple-500' },
              { label: 'Data Pasien', href: '/admin/patients', gradient: 'from-emerald-50 to-emerald-100/50', hoverGrad: 'hover:from-emerald-100 hover:to-emerald-200/50', textColor: 'text-emerald-700', icon: Users, iconBg: 'bg-emerald-500' },
              { label: 'Semua Antrian', href: '/admin/appointments', gradient: 'from-orange-50 to-orange-100/50', hoverGrad: 'hover:from-orange-100 hover:to-orange-200/50', textColor: 'text-orange-700', icon: CheckCircle, iconBg: 'bg-orange-500' },
            ].map(({ label, href, gradient, hoverGrad, textColor, icon: Icon, iconBg }) => (
              <Link
                key={href}
                to={href}
                className={`flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r ${gradient} ${hoverGrad} border border-transparent hover:border-slate-200/50 transition-all duration-200 group`}
              >
                <div className={`p-2 rounded-lg ${iconBg} shadow-sm`}>
                  <Icon className="size-3.5 text-white" />
                </div>
                <span className={`text-sm font-semibold ${textColor} flex-1`}>{label}</span>
                <ArrowRight className={`size-4 opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0 transition-all ${textColor}`} />
              </Link>
            ))}

            <div className="pt-4 border-t mt-4">
              <div className="space-y-2.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Versi Sistem</span>
                  <span className="font-medium text-slate-600">v1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Status API</span>
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Online
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Zona Waktu</span>
                  <span className="font-medium text-slate-600">WIB (UTC+7)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
