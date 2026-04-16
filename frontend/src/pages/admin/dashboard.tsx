import { useQuery } from '@tanstack/react-query'
import { Users, UserCog, Calendar, Clock, CheckCircle, Loader2 } from 'lucide-react'
import { dashboardApi } from '@/api/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardStats } from '@/types'

interface StatCardProps {
  title: string
  value: number | undefined
  icon: React.ElementType
  iconColor: string
  bgColor: string
  loading: boolean
}

function StatCard({ title, value, icon: Icon, iconColor, bgColor, loading }: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {loading ? (
              <Loader2 className="size-5 animate-spin mt-2 text-muted-foreground" />
            ) : (
              <p className="text-3xl font-bold mt-1">{value ?? 0}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${bgColor}`}>
            <Icon className={`size-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => dashboardApi.getAdminStats(),
    refetchInterval: 30000,
  })

  const stats: DashboardStats | undefined = data?.data?.data

  const cards = [
    { title: 'Total Pasien', value: stats?.total_patients, icon: Users, iconColor: 'text-blue-600', bgColor: 'bg-blue-50' },
    { title: 'Dokter Aktif', value: stats?.active_doctors, icon: UserCog, iconColor: 'text-purple-600', bgColor: 'bg-purple-50' },
    { title: 'Antrian Hari Ini', value: stats?.today_queue, icon: Calendar, iconColor: 'text-orange-600', bgColor: 'bg-orange-50' },
    { title: 'Sedang Menunggu', value: stats?.waiting_now, icon: Clock, iconColor: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { title: 'Selesai Hari Ini', value: stats?.completed_today, icon: CheckCircle, iconColor: 'text-green-600', bgColor: 'bg-green-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Admin</h1>
        <p className="text-muted-foreground mt-1">Selamat datang kembali! Berikut ringkasan klinik hari ini.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card) => (
          <StatCard key={card.title} {...card} loading={isLoading} />
        ))}
      </div>

      {/* Recent info placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tip Penggunaan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>📋 Kelola data dokter di menu <strong>Data Dokter</strong></p>
            <p>📅 Atur jadwal praktek di menu <strong>Jadwal Praktek</strong></p>
            <p>👥 Lihat semua pasien di menu <strong>Data Pasien</strong></p>
            <p>🔄 Pantau antrian real-time di menu <strong>Semua Antrian</strong></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Sistem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Versi Sistem</span>
              <span className="font-medium text-foreground">v1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Status</span>
              <span className="text-green-600 font-medium">● Online</span>
            </div>
            <div className="flex justify-between">
              <span>Zona Waktu</span>
              <span className="font-medium text-foreground">WIB (UTC+7)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
