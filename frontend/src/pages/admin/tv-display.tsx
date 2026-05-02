import { useQuery } from '@tanstack/react-query'
import { Clock, Activity, Users } from 'lucide-react'
import { appointmentApi } from '@/api/appointments'
import { Card, CardContent } from '@/components/ui/card'
import type { Appointment } from '@/types'

export default function TvDisplayPage() {
  // Ambil tanggal hari ini dalam format YYYY-MM-DD
  const d = new Date()
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const { data, isLoading } = useQuery({
    queryKey: ['tv-queue', today],
    queryFn: () => appointmentApi.getAll({ page: 1, per_page: 50, date: today }),
    refetchInterval: 5000, // Refresh setiap 5 detik
  })

  const appointments = data?.data?.data ?? []

  // Hanya ambil yang menunggu dan ditangani
  const activeAppointments = appointments.filter(a => a.status === 'waiting' || a.status === 'in_progress')

  // Kelompokkan berdasarkan dokter
  const byDoctor = activeAppointments.reduce<Record<string, Appointment[]>>((acc, appt) => {
    const doctorName = `Dr. ${appt.doctor?.user?.full_name}`
    if (!acc[doctorName]) acc[doctorName] = []
    acc[doctorName].push(appt)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      {/* Header */}
      <header className="px-8 py-6 bg-slate-900 border-b border-slate-800 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Activity className="size-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">MediQueue</h1>
            <p className="text-blue-400 text-lg font-medium">Layar Antrian Poliklinik</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold text-white tracking-wider tabular-nums">
            {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-slate-400 font-medium">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xl text-slate-400 animate-pulse">Memuat data antrian...</p>
          </div>
        ) : Object.keys(byDoctor).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-6 opacity-50">
            <Users className="size-32 text-slate-700" />
            <h2 className="text-3xl font-semibold text-slate-500">Tidak ada antrian aktif saat ini</h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
            {Object.entries(byDoctor).map(([doctorName, appts]) => {
              // Ambil pasien yang sedang ditangani (in_progress)
              const inProgress = appts.find(a => a.status === 'in_progress')
              // Ambil pasien yang sedang menunggu
              const waiting = appts.filter(a => a.status === 'waiting')
              
              const doctorSpec = appts[0]?.doctor?.specialization

              return (
                <Card key={doctorName} className="bg-slate-900 border-slate-800 overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
                  <div className="p-6 bg-slate-800/50 border-b border-slate-800/80">
                    <h2 className="text-2xl font-bold text-white truncate">{doctorName}</h2>
                    <p className="text-blue-400 font-medium text-lg">{doctorSpec}</p>
                  </div>
                  
                  <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                    {/* Yang Sedang Dipanggil */}
                    <div className="p-8 bg-blue-950/30 flex flex-col items-center justify-center border-b border-slate-800 text-center">
                      <p className="text-slate-400 font-medium uppercase tracking-widest mb-4">Sedang Ditangani</p>
                      {inProgress ? (
                        <div className="animate-pulse">
                          <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-blue-600 drop-shadow-lg mb-4">
                            {inProgress.queue_number}
                          </div>
                          <p className="text-2xl font-bold text-white">{inProgress.patient?.user?.full_name}</p>
                        </div>
                      ) : (
                        <div className="py-6">
                          <p className="text-3xl font-bold text-slate-600">-</p>
                        </div>
                      )}
                    </div>

                    {/* Antrian Selanjutnya */}
                    <div className="p-6 flex-1 overflow-y-auto">
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Clock className="size-4" /> Antrian Selanjutnya ({waiting.length})
                      </p>
                      <div className="space-y-3">
                        {waiting.slice(0, 5).map(appt => (
                          <div key={appt.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                            <span className="text-2xl font-bold text-slate-300 w-12">{appt.queue_number}</span>
                            <span className="text-lg font-medium text-slate-400 truncate flex-1 text-right">{appt.patient?.user?.full_name}</span>
                          </div>
                        ))}
                        {waiting.length > 5 && (
                          <div className="text-center pt-2">
                            <span className="text-slate-500 font-medium">+ {waiting.length - 5} antrian lainnya</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
