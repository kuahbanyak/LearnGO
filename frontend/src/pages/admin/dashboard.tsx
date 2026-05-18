import { useQuery } from '@tanstack/react-query'
import { Users, UserCog, Calendar, Clock, CheckCircle, ArrowRight, Activity, QrCode, TrendingUp, Sparkles } from 'lucide-react'
import { dashboardApi } from '@/api/dashboard'
import { appointmentApi } from '@/api/appointments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { DashboardStats } from '@/types'
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
    <div className="stagger-item" style={{ animationDelay: `${index * 70}ms` }}>
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
              {trend && (
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <TrendingUp className="size-3" />{trend}
                </p>
              )}
            </div>
            <div className={`p-3.5 rounded-xl ${gradient} shadow-lg ${shadowColor}`}>
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
    { title: 'Total Pasien', value: stats?.total_patients, icon: Users, gradient: 'gradient-primary', shadowColor: 'shadow-sky-500/20', trend: 'Pasien terdaftar' },
    { title: 'Dokter Aktif', value: stats?.active_doctors, icon: UserCog, gradient: 'gradient-ocean', shadowColor: 'shadow-cyan-500/20', trend: 'Dokter bertugas' },
    { title: 'Antrian Hari Ini', value: stats?.today_queue, icon: Calendar, gradient: 'gradient-warm', shadowColor: 'shadow-orange-500/20', trend: 'Total antrian' },
    { title: 'Sedang Menunggu', value: stats?.waiting_now, icon: Clock, gradient: 'gradient-warning', shadowColor: 'shadow-amber-500/20', trend: 'Belum dipanggil' },
    { title: 'Selesai', value: stats?.completed_today, icon: CheckCircle, gradient: 'gradient-success', shadowColor: 'shadow-emerald-500/20', trend: 'Kunjungan selesai' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Dashboard Admin</h1>
          <p className="text-slate-500 mt-1.5">
            Ringkasan klinik,{' '}
            <span className="font-medium text-slate-700">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
          <Activity className="size-4 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-700">Sistem Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card, index) => (
          <StatCard key={card.title} {...card} loading={isLoading} index={index} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-50">
                <Clock className="size-4 text-orange-500" />
              </div>
              Antrian Hari Ini
              {stats?.waiting_now !== undefined && stats.waiting_now > 0 && (
                <span className="ml-1 px-3 py-1 text-[11px] bg-orange-100 text-orange-700 rounded-full font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 dot-pulse" />
                  {stats.waiting_now} menunggu
                </span>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs text-slate-400 hover:text-primary">
              <Link to="/admin/appointments">
                Lihat Semua <ArrowRight className="size-3 ml-1.5" />
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
              <div className="text-center py-12 text-slate-400">
                <Calendar className="size-14 mx-auto mb-4 opacity-20" />
                <p className="text-sm font-medium">Tidak ada antrian hari ini</p>
                <p className="text-xs mt-1">Antrian akan muncul saat pasien mendaftar</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {todayAppointments.map((appt, index) => (
                  <div key={appt.id}
                    className="flex items-center justify-between py-4 gap-4 stagger-item hover:bg-slate-50/50 -mx-2 px-2 rounded-xl transition-colors"
                    style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md shadow-sky-500/20">
                        {appt.queue_number}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{appt.patient?.user?.full_name}</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {appt.doctor?.user?.full_name} · {appt.doctor?.specialization}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
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

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="size-4 text-amber-500" />
              Aksi Cepat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'Scan Check-in', href: '/admin/scan-checkin', gradient: 'from-cyan-500 to-sky-600', bg: 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200' },
              { label: 'Tambah Dokter', href: '/admin/doctors', gradient: 'from-sky-500 to-blue-600', bg: 'bg-sky-50 hover:bg-sky-100 border-sky-200' },
              { label: 'Atur Jadwal', href: '/admin/schedules', gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-50 hover:bg-violet-100 border-violet-200' },
              { label: 'Data Pasien', href: '/admin/patients', gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200' },
              { label: 'Semua Antrian', href: '/admin/appointments', gradient: 'from-orange-500 to-amber-600', bg: 'bg-orange-50 hover:bg-orange-100 border-orange-200' },
            ].map(({ label, href, gradient, bg }) => (
              <Link
                key={href}
                to={href}
                className={`flex items-center gap-3 p-3.5 rounded-xl border ${bg} transition-all duration-200 group`}
              >
                <div className={`p-2 rounded-lg bg-linear-to-br ${gradient} shadow-sm`}>
                  {href.includes('scan') ? <QrCode className="size-3.5 text-white" /> :
                   href.includes('doctors') ? <UserCog className="size-3.5 text-white" /> :
                   href.includes('schedules') ? <Calendar className="size-3.5 text-white" /> :
                   href.includes('patients') ? <Users className="size-3.5 text-white" /> :
                   <CheckCircle className="size-3.5 text-white" />}
                </div>
                <span className="text-sm font-semibold text-slate-700 flex-1">{label}</span>
                <ArrowRight className="size-4 text-slate-400 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Link>
            ))}

            <div className="pt-4 border-t mt-4">
              <div className="space-y-2.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Versi Sistem</span>
                  <span className="font-semibold text-slate-600">v1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Status API</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dot-pulse" />
                    Online
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Zona Waktu</span>
                  <span className="font-semibold text-slate-600">WIB (UTC+7)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
