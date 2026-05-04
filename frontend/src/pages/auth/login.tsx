import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import {
  Heart, Eye, EyeOff, Loader2, ArrowRight,
  ShieldCheck, Clock, Users, Stethoscope, Activity, Star
} from 'lucide-react'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/auth-store'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Floating icon decoration
function FloatingIcon({ icon: Icon, className }: { icon: React.ElementType; className?: string }) {
  return (
    <div className={`absolute flex items-center justify-center rounded-2xl glass ${className}`}>
      <Icon className="text-white/60" style={{ width: '55%', height: '55%' }} />
    </div>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [hasError, setHasError] = useState(false)
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
      setHasError(true)
      toast.error('Login gagal', msg)
      setTimeout(() => setHasError(false), 500)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    mutation.mutate(form)
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Panel - Premium Branding */}
      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, hsl(220 27% 10%) 0%, hsl(230 35% 7%) 100%)' }}>

        {/* Animated background blobs */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)' }}
        />
        <div className="absolute top-1/3 left-1/2 w-[300px] h-[300px] rounded-full blur-[80px]"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)' }} />

        {/* Dot grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
            backgroundSize: '28px 28px'
          }} />

        {/* Floating decorative icons */}
        <FloatingIcon icon={Stethoscope}
          className="w-20 h-20 top-[15%] right-[18%] float-anim" />
        <FloatingIcon icon={Heart}
          className="w-16 h-16 top-[40%] left-[8%] float-anim-delay-1" />
        <FloatingIcon icon={Activity}
          className="w-14 h-14 bottom-[25%] right-[12%] float-anim-delay-2" />
        <FloatingIcon icon={ShieldCheck}
          className="w-18 h-18 bottom-[15%] left-[18%] float-anim" />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-xl shadow-blue-500/40 glow-primary">
              <Heart className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">MediQueue</h1>
              <p className="text-[11px] text-slate-500 font-medium">Sistem Antrian Klinik Pintar</p>
            </div>
          </div>

          {/* Main hero text */}
          <div className="space-y-10 max-w-[520px]">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
                <span className="w-2 h-2 rounded-full bg-blue-400 dot-pulse" />
                <span className="text-blue-300 text-xs font-semibold tracking-wide">SISTEM LIVE AKTIF</span>
              </div>
              <h2 className="text-5xl xl:text-6xl font-black text-white leading-[1.08] tracking-tight">
                Kelola Antrian<br />
                <span className="gradient-text">Lebih Efisien</span>
              </h2>
              <p className="text-slate-400 mt-5 text-xl leading-relaxed">
                Platform terpadu untuk manajemen antrian pasien, jadwal dokter, dan rekam medis digital.
              </p>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: Clock, label: 'Real-time Queue', desc: 'Update otomatis tanpa refresh' },
                { icon: ShieldCheck, label: 'Data Aman', desc: 'Enkripsi JWT & bcrypt' },
                { icon: Users, label: 'Multi-Role', desc: 'Admin, Dokter & Pasien' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label}
                  className="glass rounded-2xl p-4 group hover:bg-white/12 transition-all duration-300 border border-white/5 hover:border-white/10">
                  <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center mb-3 shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform">
                    <Icon className="size-4 text-white" />
                  </div>
                  <p className="text-sm font-bold text-white">{label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex -space-x-2">
                {['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500'].map((c, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-slate-900 flex items-center justify-center`}>
                    <span className="text-white text-[10px] font-bold">{['A', 'D', 'P', '+'][i]}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex text-amber-400 mb-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} className="size-3 fill-current" />)}
                </div>
                <p className="text-xs text-slate-500">Dipercaya 500+ pengguna klinik</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-700 font-medium">
            © 2026 MediQueue · Capstone Project · v1.0.0
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-[42%] flex items-center justify-center p-6 sm:p-10 relative overflow-hidden">
        {/* Subtle background */}
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(14,165,233,0.04) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(99,102,241,0.03) 0%, transparent 60%)' }} />

        {/* Mobile accent bar */}
        <div className="lg:hidden absolute top-0 left-0 right-0 h-1 gradient-primary" />

        <div className="w-full max-w-[400px] relative z-10 slide-in-bottom">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Heart className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">MediQueue</h1>
              <p className="text-[11px] text-slate-500">Sistem Antrian Klinik</p>
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Selamat Datang 👋</h2>
            <p className="text-slate-500 mt-2 text-base">Masuk untuk melanjutkan ke MediQueue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error alert */}
            {error && (
              <div className={`p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-3 ${hasError ? 'shake' : ''}`}>
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold">!</span>
                </div>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="login-email">Email</label>
              <Input
                id="login-email"
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500 rounded-xl shadow-sm text-base"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="login-password">Password</label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500 pr-12 rounded-xl shadow-sm text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              id="login-submit"
              className="w-full h-12 gradient-primary border-0 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:opacity-95 transition-all duration-300 text-base mt-2"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <><Loader2 className="size-4 animate-spin mr-2" /> Masuk...</>
              ) : (
                <>Masuk ke Akun <ArrowRight className="size-4 ml-2" /></>
              )}
            </Button>

            <p className="text-center text-sm text-slate-500 pt-1">
              Belum punya akun?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-bold transition-colors">
                Daftar sekarang →
              </Link>
            </p>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400 font-medium">Demo Accounts</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Demo accounts */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { role: '👑 Admin', email: 'admin@mediqueue.com', pass: 'Admin@123', color: 'bg-blue-50 hover:bg-blue-100 border-blue-100 text-blue-700' },
              { role: '🩺 Dokter', email: 'doctor@mediqueue.com', pass: 'Doctor@123', color: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-100 text-emerald-700' },
            ].map(({ role, email, pass, color }) => (
              <button
                key={email}
                type="button"
                onClick={() => setForm({ email, password: pass })}
                className={`flex flex-col items-start p-3 rounded-xl border text-xs transition-all hover:shadow-sm ${color}`}
              >
                <span className="font-bold text-sm">{role}</span>
                <span className="opacity-60 mt-0.5 truncate w-full text-left">{email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
