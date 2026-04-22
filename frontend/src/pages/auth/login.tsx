import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Heart, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, Clock, Users } from 'lucide-react'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/auth-store'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '' })

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (res) => {
      const { token, user } = res.data.data!
      login(user, token)
      const redirectMap = {
        admin: '/admin/dashboard',
        doctor: '/doctor/dashboard',
        patient: '/patient/dashboard',
      }
      navigate(redirectMap[user.role])
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      const msg = e?.response?.data?.message || 'Login gagal. Periksa email dan password.'
      setError(msg)
      toast.error('Login gagal', msg)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    mutation.mutate(form)
  }

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
          <div className="space-y-8 max-w-lg">
            <div>
              <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight">
                Kelola Antrian
                <br />
                <span className="gradient-text">Lebih Efisien</span>
              </h2>
              <p className="text-slate-400 mt-4 text-lg leading-relaxed">
                Solusi digital untuk manajemen antrian pasien, jadwal dokter, dan rekam medis dalam satu platform terpadu.
              </p>
            </div>

            {/* Feature pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: Clock, label: 'Antrian Real-time', desc: 'Pantau status langsung' },
                { icon: ShieldCheck, label: 'Rekam Medis Aman', desc: 'Data terenkripsi' },
                { icon: Users, label: 'Multi-Role', desc: 'Admin, Dokter, Pasien' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="glass rounded-xl p-4 group hover:bg-white/10 transition-all duration-300">
                  <Icon className="size-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-[11px] text-slate-500">{desc}</p>
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

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-8 bg-gradient-to-br from-slate-50 to-white relative">
        {/* Mobile decorative elements */}
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
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Masuk ke akun Anda</h2>
            <p className="text-slate-500 mt-2">Selamat datang kembali! Silakan masuk.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2"
                style={{ animation: 'fadeSlideUp 0.3s ease' }}>
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <span className="text-xs">!</span>
                </div>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500 rounded-xl shadow-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Password</label>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500 pr-10 rounded-xl shadow-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 gradient-primary border-0 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 text-[15px]"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <><Loader2 className="size-4 animate-spin" /> Masuk...</>
              ) : (
                <><span>Masuk</span><ArrowRight className="size-4 ml-1" /></>
              )}
            </Button>

            <p className="text-center text-sm text-slate-500">
              Belum punya akun?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                Daftar sekarang
              </Link>
            </p>
          </form>

          {/* Demo accounts */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-500 font-semibold mb-3 uppercase tracking-wider">Demo Accounts</p>
            <div className="space-y-2">
              {[
                { role: '👑 Admin', email: 'admin@mediqueue.com', pass: 'Admin@123', color: 'bg-blue-50 border-blue-100 text-blue-700' },
                { role: '🩺 Dokter', email: 'doctor@mediqueue.com', pass: 'Doctor@123', color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
              ].map(({ role, email, pass, color }) => (
                <button
                  key={email}
                  type="button"
                  onClick={() => setForm({ email, password: pass })}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all hover:shadow-sm ${color}`}
                >
                  <span className="font-medium">{role}</span>
                  <span className="text-[11px] opacity-70">{email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
