import { useQuery } from '@tanstack/react-query'
import { Activity, Users, Heart, Wifi } from 'lucide-react'
import { appointmentApi } from '@/api/appointments'
import type { Appointment } from '@/types'
import { useState, useEffect } from 'react'

// Live clock component
function LiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="text-right">
      <p className="text-5xl font-black text-white tracking-widest tabular-nums font-mono leading-none">
        {now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </p>
      <p className="text-blue-300 font-medium mt-1.5 text-lg">
        {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </div>
  )
}

// Queue card per doctor — premium version
function DoctorQueueCard({ doctorName, spec, inProgress, waiting }: {
  doctorName: string
  spec: string
  inProgress: Appointment | undefined
  waiting: Appointment[]
}) {
  return (
    <div className="flex flex-col rounded-3xl overflow-hidden border border-slate-700/60 bg-slate-900/80"
      style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
      {/* Doctor Header */}
      <div className="px-8 py-6 border-b border-slate-700/60"
        style={{ background: 'linear-gradient(135deg, hsl(220 27% 18%) 0%, hsl(225 30% 14%) 100%)' }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30 glow-primary">
            <Heart className="size-7 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-white truncate leading-tight">Dr. {doctorName}</h2>
            <p className="text-blue-300 font-semibold mt-0.5 text-base">{spec}</p>
          </div>
        </div>
      </div>

      {/* Currently Serving */}
      <div className={`px-8 py-10 flex flex-col items-center justify-center text-center border-b border-slate-700/60 transition-all duration-500 ${
        inProgress ? 'bg-blue-950/40' : 'bg-slate-900/60'
      }`}>
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-slate-400 mb-5">
          ⚡ Sedang Ditangani
        </p>
        {inProgress ? (
          <div className="queue-call-anim rounded-2xl p-6 w-full max-w-[200px]"
            style={{ background: 'linear-gradient(135deg, hsl(199 89% 48%) 0%, hsl(217 89% 61%) 100%)' }}>
            <p className="tv-queue-number text-white leading-none">{inProgress.queue_number}</p>
            <p className="text-white/90 font-bold text-xl mt-3 leading-tight">
              {inProgress.patient?.user?.full_name}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <span className="text-5xl font-black text-slate-700">—</span>
            </div>
            <p className="text-slate-600 font-medium">Tidak ada pasien</p>
          </div>
        )}
      </div>

      {/* Waiting List */}
      <div className="flex-1 px-6 py-5 bg-slate-950/40">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 dot-pulse" />
            Menunggu
          </p>
          <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full">
            {waiting.length} antrian
          </span>
        </div>
        <div className="space-y-2.5">
          {waiting.slice(0, 6).map((appt, idx) => (
            <div key={appt.id}
              className="flex items-center gap-4 px-4 py-3 rounded-xl border border-slate-700/40 bg-slate-800/40"
              style={{ animationDelay: `${idx * 80}ms` }}>
              <span className="text-3xl font-black text-slate-200 w-14 text-center tabular-nums leading-none">
                {appt.queue_number}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-slate-300 truncate">
                  {appt.patient?.user?.full_name}
                </p>
              </div>
            </div>
          ))}
          {waiting.length === 0 && (
            <div className="flex flex-col items-center py-6 text-slate-700">
              <Users className="size-10 mb-2 opacity-30" />
              <p className="text-sm font-medium">Tidak ada antrian menunggu</p>
            </div>
          )}
          {waiting.length > 6 && (
            <p className="text-center text-slate-600 text-sm font-medium pt-1">
              +{waiting.length - 6} antrian lainnya...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TvDisplayPage() {
  const d = new Date()
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const { data, isLoading } = useQuery({
    queryKey: ['tv-queue', today],
    queryFn: () => appointmentApi.getAll({ page: 1, per_page: 100, date: today }),
    refetchInterval: 5000,
  })

  const appointments = data?.data?.data ?? []
  const activeAppointments = appointments.filter(a => a.status === 'waiting' || a.status === 'in_progress')

  // Group by doctor name
  const byDoctor = activeAppointments.reduce<Record<string, Appointment[]>>((acc, appt) => {
    const key = appt.doctor?.user?.full_name ?? 'Unknown'
    if (!acc[key]) acc[key] = []
    acc[key].push(appt)
    return acc
  }, {})

  const totalWaiting = activeAppointments.filter(a => a.status === 'waiting').length
  const totalInProgress = activeAppointments.filter(a => a.status === 'in_progress').length

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Premium Header */}
      <header className="shrink-0 border-b border-slate-800/80"
        style={{ background: 'linear-gradient(180deg, hsl(220 27% 10%) 0%, hsl(225 30% 8%) 100%)' }}>
        <div className="px-8 py-5 flex items-center justify-between">
          {/* Left: Logo + Stats */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-xl shadow-blue-500/30 glow-primary">
                <Activity className="size-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">MediQueue</h1>
                <p className="text-blue-400 font-semibold">Layar Antrian Poliklinik</p>
              </div>
            </div>

            {/* Live stats pills */}
            <div className="hidden xl:flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
                <span className="w-2 h-2 rounded-full bg-amber-400 dot-pulse" />
                <span className="text-amber-300 font-bold text-lg">{totalWaiting}</span>
                <span className="text-amber-500 text-sm font-medium">Menunggu</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
                <span className="w-2 h-2 rounded-full bg-blue-400 dot-pulse" />
                <span className="text-blue-300 font-bold text-lg">{totalInProgress}</span>
                <span className="text-blue-500 text-sm font-medium">Ditangani</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <Wifi className="size-3.5 text-emerald-400" />
                <span className="text-emerald-400 text-sm font-medium">Live</span>
              </div>
            </div>
          </div>

          {/* Right: Clock */}
          <LiveClock />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-2xl text-slate-400 font-medium animate-pulse">Memuat data antrian...</p>
          </div>
        ) : Object.keys(byDoctor).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="w-32 h-32 rounded-3xl bg-slate-800/50 flex items-center justify-center mb-2">
              <Users className="size-16 text-slate-700" />
            </div>
            <div className="text-center">
              <h2 className="text-4xl font-bold text-slate-500 mb-2">Tidak ada antrian aktif</h2>
              <p className="text-slate-600 text-xl">Saat ini tidak ada pasien yang sedang menunggu</p>
            </div>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            Object.keys(byDoctor).length === 1 ? 'grid-cols-1 max-w-2xl mx-auto'
            : Object.keys(byDoctor).length === 2 ? 'grid-cols-2'
            : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
          }`}>
            {Object.entries(byDoctor).map(([doctorName, appts]) => {
              const inProgress = appts.find(a => a.status === 'in_progress')
              const waiting = appts.filter(a => a.status === 'waiting')
              const spec = appts[0]?.doctor?.specialization ?? ''
              return (
                <DoctorQueueCard
                  key={doctorName}
                  doctorName={doctorName}
                  spec={spec}
                  inProgress={inProgress}
                  waiting={waiting}
                />
              )
            })}
          </div>
        )}
      </main>

      {/* Bottom Ticker */}
      <footer className="shrink-0 py-3 border-t border-slate-800/60"
        style={{ background: 'linear-gradient(135deg, hsl(199 89% 48% / 0.08) 0%, hsl(217 89% 61% / 0.08) 100%)' }}>
        <div className="ticker-wrap">
          <div className="ticker-content text-slate-400 text-sm font-medium">
            🏥 Selamat datang di Poliklinik kami &nbsp;&nbsp;•&nbsp;&nbsp;
            📢 Harap perhatikan nomor antrian Anda &nbsp;&nbsp;•&nbsp;&nbsp;
            ⏰ Antrian diperbarui setiap 5 detik &nbsp;&nbsp;•&nbsp;&nbsp;
            💊 Jaga kesehatan dan tetap semangat! &nbsp;&nbsp;•&nbsp;&nbsp;
            📱 Pantau antrian Anda melalui aplikasi MediQueue &nbsp;&nbsp;•&nbsp;&nbsp;
            🩺 Terima kasih telah mempercayai pelayanan kesehatan kami &nbsp;&nbsp;•&nbsp;&nbsp;
          </div>
        </div>
      </footer>
    </div>
  )
}
