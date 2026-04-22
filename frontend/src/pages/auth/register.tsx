import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Heart, Loader2, ArrowRight, User, Mail, Phone, Lock } from 'lucide-react'
import { authApi } from '@/api/auth'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    email: '', password: '', full_name: '', phone: ''
  })

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      toast.success('Registrasi berhasil!', 'Silakan login dengan akun Anda.')
      navigate('/login')
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      const msg = e?.response?.data?.message || 'Registrasi gagal.'
      setError(msg)
      toast.error('Registrasi gagal', msg)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    mutation.mutate(form)
  }

  const fields = [
    { label: 'Nama Lengkap', field: 'full_name', type: 'text', placeholder: 'John Doe', icon: User, required: true },
    { label: 'Email', field: 'email', type: 'email', placeholder: 'email@example.com', icon: Mail, required: true },
    { label: 'No. Telepon', field: 'phone', type: 'tel', placeholder: '08xxxxxxxxxx', icon: Phone, required: false },
    { label: 'Password', field: 'password', type: 'password', placeholder: '••••••••', icon: Lock, required: true },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, hsl(220 27% 12%) 0%, hsl(225 35% 8%) 100%)' }}>
        {/* Animated background blobs */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/8 rounded-full blur-[80px]" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Top */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Heart className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">MediQueue</h1>
              <p className="text-[11px] text-slate-500">Sistem Antrian Klinik Pintar</p>
            </div>
          </div>

          {/* Center */}
          <div className="space-y-6 max-w-lg">
            <div>
              <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight">
                Bergabung dengan
                <br />
                <span className="gradient-text">MediQueue</span>
              </h2>
              <p className="text-slate-400 mt-4 text-lg leading-relaxed">
                Daftarkan diri Anda untuk menikmati kemudahan pendaftaran antrian dokter secara online.
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {[
                { step: '1', title: 'Daftar Akun', desc: 'Isi data diri Anda' },
                { step: '2', title: 'Pilih Dokter', desc: 'Pilih dokter & jadwal' },
                { step: '3', title: 'Dapat Antrian', desc: 'Nomor antrian otomatis' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex items-center gap-4 glass rounded-xl p-4 hover:bg-white/10 transition-all duration-300">
                  <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-lg shadow-blue-500/20">
                    {step}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{title}</p>
                    <p className="text-[11px] text-slate-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <p className="text-xs text-slate-600">
            © 2026 MediQueue · Capstone Project
          </p>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-8 bg-gradient-to-br from-slate-50 to-white relative">
        <div className="lg:hidden absolute top-0 left-0 right-0 h-1 gradient-primary" />

        <div className="w-full max-w-[420px] space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-6">
            <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Heart className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">MediQueue</h1>
              <p className="text-[11px] text-slate-500">Sistem Antrian Klinik</p>
            </div>
          </div>

          {/* Header */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Buat akun baru</h2>
            <p className="text-slate-500 mt-2">Daftarkan diri Anda untuk menggunakan MediQueue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2"
                style={{ animation: 'fadeSlideUp 0.3s ease' }}>
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <span className="text-xs">!</span>
                </div>
                {error}
              </div>
            )}

            {fields.map(({ label, field, type, placeholder, icon: Icon, required }) => (
              <div key={field} className="space-y-2">
                <label className="text-sm font-medium text-slate-700">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    type={type}
                    placeholder={placeholder}
                    value={form[field as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    className="h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500 pl-10 rounded-xl shadow-sm"
                    required={required}
                    minLength={field === 'password' ? 8 : undefined}
                  />
                </div>
              </div>
            ))}

            <Button
              type="submit"
              className="w-full h-11 gradient-primary border-0 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 text-[15px] mt-2"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <><Loader2 className="size-4 animate-spin" /> Mendaftar...</>
              ) : (
                <><span>Daftar Sekarang</span><ArrowRight className="size-4 ml-1" /></>
              )}
            </Button>

            <p className="text-center text-sm text-slate-500">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                Masuk
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
