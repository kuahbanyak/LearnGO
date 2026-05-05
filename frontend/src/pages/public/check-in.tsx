import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { QrCode, CheckCircle, Clock, User, Stethoscope, AlertCircle } from 'lucide-react'
import { checkInApi } from '@/api/checkin'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CheckInPage() {
  const [token, setToken] = useState('')
  const [checkedIn, setCheckedIn] = useState(false)
  const [appointmentData, setAppointmentData] = useState<{
    appointment_id: string
    queue_number: number
    doctor: string
    status: string
  } | null>(null)

  const checkInMutation = useMutation({
    mutationFn: () => checkInApi.checkIn(token),
    onSuccess: (response) => {
      const data = response.data.data
      setCheckedIn(true)
      setAppointmentData(data)
      toast.success('Check-in Berhasil!', `Nomor antrian Anda: ${data.queue_number}`)
    },
    onError: (error: any) => {
      toast.error('Check-in Gagal', error.response?.data?.message || 'Token tidak valid')
    },
  })

  const handleCheckIn = () => {
    if (!token.trim()) {
      toast.error('Token Kosong', 'Masukkan token check-in Anda')
      return
    }
    checkInMutation.mutate()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary shadow-lg shadow-blue-500/30 mb-4">
            <QrCode className="size-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Check-in Klinik</h1>
          <p className="text-slate-500 mt-2">Masukkan token dari QR code Anda</p>
        </div>

        {!checkedIn ? (
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-center">Token Check-in</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value.toUpperCase())}
                  placeholder="Contoh: A1B2C3D4E5F6..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center text-lg font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  maxLength={64}
                />
              </div>

              <Button
                onClick={handleCheckIn}
                disabled={checkInMutation.isPending || !token.trim()}
                className="w-full h-12 gradient-primary text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30"
              >
                {checkInMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </span>
                ) : (
                  'Check-in Sekarang'
                )}
              </Button>

              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                <AlertCircle className="size-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700">
                  Token check-in dapat ditemukan pada QR code yang dikirimkan melalui email atau WhatsApp.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-xl overflow-hidden">
            <div className="h-2 gradient-success" />
            <CardContent className="pt-6 pb-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                <CheckCircle className="size-8 text-emerald-600" />
              </div>

              <h2 className="text-xl font-bold text-slate-900 mb-1">Check-in Berhasil!</h2>
              <p className="text-slate-500 text-sm mb-6">Silakan tunggu hingga nomor Anda dipanggil</p>

              {appointmentData && (
                <div className="space-y-3">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">Nomor Antrian</p>
                    <p className="text-4xl font-bold text-primary">{appointmentData.queue_number}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="size-3.5 text-slate-400" />
                        <p className="text-xs text-slate-500">Dokter</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        Dr. {appointmentData.doctor}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="size-3.5 text-slate-400" />
                        <p className="text-xs text-slate-500">Status</p>
                      </div>
                      <p className="text-sm font-semibold text-emerald-600">Menunggu</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg mt-4">
                    <Stethoscope className="size-4 text-amber-600" />
                    <p className="text-xs text-amber-700">
                      Dokter akan memanggil nomor Anda. Harap tetap di area tunggu.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          MediQueue © 2026 — Sistem Antrian Klinik Pintar
        </p>
      </div>
    </div>
  )
}
