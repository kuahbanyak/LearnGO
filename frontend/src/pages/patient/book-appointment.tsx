import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, Clock, Loader2, CheckCircle } from 'lucide-react'
import { doctorApi, scheduleApi } from '@/api/doctors'
import { appointmentApi } from '@/api/appointments'
import { toast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DAYS } from '@/lib/utils'
import type { DoctorSchedule } from '@/types'

export default function BookAppointmentPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(1)
  const [selectedDoctor, setSelectedDoctor] = useState<string>('')
  const [selectedSchedule, setSelectedSchedule] = useState<DoctorSchedule | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const { data: doctorsData, isLoading: doctorsLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorApi.getAll({ per_page: 100 }),
  })

  const { data: schedulesData, isLoading: schedulesLoading } = useQuery({
    queryKey: ['schedules', selectedDoctor],
    queryFn: () => scheduleApi.getByDoctor(selectedDoctor),
    enabled: !!selectedDoctor,
  })

  const bookMutation = useMutation({
    mutationFn: appointmentApi.book,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['patient-stats'] })
      toast.success('Antrian berhasil didaftarkan!', 'Silakan datang sesuai jadwal.')
      setSuccess(true)
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      const msg = e?.response?.data?.message || 'Gagal membooking antrian'
      toast.error('Gagal mendaftar antrian', msg)
      setError(msg)
    },
  })

  const doctors = doctorsData?.data?.data ?? []
  const schedules = schedulesData?.data?.data ?? []

  const getNextDate = (dayOfWeek: number): string => {
    const today = new Date()
    const diff = (dayOfWeek - today.getDay() + 7) % 7
    const next = new Date(today)
    next.setDate(today.getDate() + (diff === 0 ? 7 : diff))

    // Format YYYY-MM-DD in local time
    const yyyy = next.getFullYear()
    const mm = String(next.getMonth() + 1).padStart(2, '0')
    const dd = String(next.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate('/patient/dashboard')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [success, navigate])

  const handleBook = () => {
    if (!selectedSchedule || !selectedDate) return
    setError('')
    bookMutation.mutate({
      doctor_id: selectedDoctor,
      schedule_id: selectedSchedule.id,
      appointment_date: selectedDate,
    })
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="size-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Booking Berhasil!</h2>
        <p className="text-muted-foreground">Antrian Anda telah terdaftar.</p>
        <p className="text-sm text-slate-400 mt-2 animate-pulse">Mengalihkan ke beranda...</p>
        <Button onClick={() => navigate('/patient/dashboard')}
          className="gradient-primary text-white border-0 mt-4">
          Ke Beranda Sekarang
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Daftar Antrian</h1>
        <p className="text-slate-500 mt-1">Pilih dokter dan jadwal yang tersedia</p>
      </div>

      {/* Step 1: Choose Doctor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="w-6 h-6 rounded-full gradient-primary text-white text-xs flex items-center justify-center font-bold">1</span>
            Pilih Dokter
          </CardTitle>
        </CardHeader>
        <CardContent>
          {doctorsLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="size-5 animate-spin" /></div>
          ) : (
            <div className="space-y-2">
              {doctors.map((doctor) => (
                <button
                  key={doctor.id}
                  onClick={() => { setSelectedDoctor(doctor.id); setSelectedSchedule(null); setStep(2) }}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-all ${selectedDoctor === doctor.id
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                >
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold shrink-0">
                    {doctor.user?.full_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{doctor.user?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{doctor.specialization}</p>
                  </div>
                  {selectedDoctor === doctor.id && (
                    <CheckCircle className="size-4 text-primary ml-auto" />
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Choose Schedule */}
      {step >= 2 && selectedDoctor && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-6 h-6 rounded-full gradient-primary text-white text-xs flex items-center justify-center font-bold">2</span>
              Pilih Jadwal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {schedulesLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="size-5 animate-spin" /></div>
            ) : schedules.filter(s => s.is_active).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Tidak ada jadwal tersedia</p>
            ) : (
              <div className="space-y-2">
                {schedules.filter(s => s.is_active).map((schedule) => {
                  const nextDate = getNextDate(schedule.day_of_week)
                  return (
                    <button
                      key={schedule.id}
                      onClick={() => {
                        setSelectedSchedule(schedule)
                        setSelectedDate(nextDate)
                        setStep(3)
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-lg border text-left transition-all ${selectedSchedule?.id === schedule.id
                          ? 'border-primary bg-primary/5'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="size-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{DAYS[schedule.day_of_week]}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            <span>{schedule.start_time} - {schedule.end_time}</span>
                            <span className="mx-1">·</span>
                            <span>Maks {schedule.max_patient} pasien</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-slate-900">{new Date(nextDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                        {selectedSchedule?.id === schedule.id && (
                          <CheckCircle className="size-4 text-primary ml-auto mt-1" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirm */}
      {step >= 3 && selectedSchedule && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-6 h-6 rounded-full gradient-primary text-white text-xs flex items-center justify-center font-bold">3</span>
              Konfirmasi Booking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
            )}
            <div className="p-4 rounded-lg bg-slate-50 border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tanggal</span>
                <span className="font-medium">{new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Jam Praktek</span>
                <span className="font-medium">{selectedSchedule.start_time} - {selectedSchedule.end_time}</span>
              </div>
            </div>
            <Button
              onClick={handleBook}
              disabled={bookMutation.isPending}
              className="w-full gradient-primary text-white border-0"
            >
              {bookMutation.isPending
                ? <><Loader2 className="size-4 animate-spin" /> Mendaftar...</>
                : 'Konfirmasi & Daftar'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
