import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { QrCode, Camera, CheckCircle, XCircle, Loader2, User, Hash, Stethoscope, Upload } from 'lucide-react'
import { Html5QrcodeScanner, Html5QrcodeScanType, Html5Qrcode } from 'html5-qrcode'
import { checkInApi } from '@/api/checkin'
import { toast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ScanResult {
  appointment_id: string
  queue_number: number
  doctor: string
  status: string
}

export default function ScanCheckInPage() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [manualToken, setManualToken] = useState('')
  const [scannerError, setScannerError] = useState('')
  const [uploading, setUploading] = useState(false)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const checkInMutation = useMutation({
    mutationFn: (token: string) => checkInApi.checkIn(token),
    onSuccess: (response) => {
      const data = response.data.data
      if (data) {
        setScanResult(data)
        toast.success('Check-in Berhasil!', `Antrian #${data.queue_number} telah masuk.`)
      }
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      const msg = e?.response?.data?.message || 'Token tidak valid atau sudah digunakan'
      setScannerError(msg)
      toast.error('Check-in Gagal', msg)
    },
  })

  useEffect(() => {
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
    }

    scannerRef.current = new Html5QrcodeScanner('qr-reader', config, false)

    scannerRef.current.render(
      (decodedText) => {
        const token = extractToken(decodedText)
        if (token) {
          checkInMutation.mutate(token)
        } else {
          setScannerError('Format QR tidak valid')
        }
      },
      () => {}
    )

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {})
      }
    }
  }, [])

  const extractToken = (url: string): string | null => {
    const match = url.match(/check-in\/([a-f0-9]{64})$/)
    return match ? match[1] : url.length === 64 ? url : null
  }

  const handleManualCheckIn = () => {
    if (!manualToken.trim()) return
    const token = extractToken(manualToken.trim())
    if (token) {
      checkInMutation.mutate(token)
    } else {
      toast.error('Format Token Salah', 'Masukkan 64 karakter token atau URL lengkap.')
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setScannerError('')

    try {
      const html5QrCode = new Html5Qrcode('qr-reader-hidden')
      const decodedText = await html5QrCode.scanFile(file, true)
      const token = extractToken(decodedText)
      
      if (token) {
        checkInMutation.mutate(token)
      } else {
        setScannerError('QR code tidak mengandung token check-in yang valid')
        toast.error('Format QR Salah', 'QR code tidak mengandung token check-in.')
      }
    } catch {
      setScannerError('Gagal membaca QR code dari gambar')
      toast.error('Gagal Membaca QR', 'Pastikan gambar berisi QR code yang jelas.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const resetScanner = () => {
    setScanResult(null)
    setScannerError('')
    setManualToken('')
  }

  if (scanResult) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Check-in Berhasil</h1>
          <p className="text-slate-500 mt-1">Pasien telah masuk ke antrian</p>
        </div>

        <Card className="border-2 border-emerald-200 bg-emerald-50/50">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle className="size-8 text-emerald-600" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Hash className="size-5 text-slate-400" />
                <span className="text-4xl font-bold text-emerald-600">{scanResult.queue_number}</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-slate-600">
                <User className="size-4" />
                <span className="font-medium">Pasian terdaftar</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-slate-500">
                <Stethoscope className="size-4" />
                <span>{scanResult.doctor}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={resetScanner} className="w-full gradient-primary text-white">
          Scan Pasien Berikutnya
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center justify-center gap-2">
          <QrCode className="size-6" />
          Scan QR Check-in
        </h1>
        <p className="text-slate-500 mt-1">Scan QR code pasien untuk check-in otomatis</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="size-4" />
            Kamera Scanner
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scannerError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
              <XCircle className="size-4 shrink-0" />
              {scannerError}
            </div>
          )}
          <div id="qr-reader" className="w-full overflow-hidden rounded-lg" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Input Manual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-500">Jika scanner tidak berfungsi, masukkan token manual:</p>
          <div className="flex gap-2">
            <Input
              placeholder="Paste token atau URL check-in..."
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleManualCheckIn}
              disabled={checkInMutation.isPending || !manualToken.trim()}
              className="gradient-primary text-white"
            >
              {checkInMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : 'Check-in'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="size-4" />
            Upload QR Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-3">Upload gambar QR code pasien:</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="qr-upload"
          />
          <label
            htmlFor="qr-upload"
            className={`flex items-center justify-center gap-2 p-6 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer transition-all hover:border-primary hover:bg-primary/5 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {uploading ? (
              <>
                <Loader2 className="size-5 animate-spin text-primary" />
                <span className="text-sm text-slate-600">Memproses...</span>
              </>
            ) : (
              <>
                <Upload className="size-5 text-slate-400" />
                <span className="text-sm text-slate-600">Klik untuk upload gambar QR</span>
              </>
            )}
          </label>
        </CardContent>
      </Card>

      <div id="qr-reader-hidden" style={{ display: 'none' }} />
    </div>
  )
}
