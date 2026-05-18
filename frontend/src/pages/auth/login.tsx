import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import {
  Heart, Eye, EyeOff, Loader2, ArrowRight,
  ShieldCheck, Clock, Users, Stethoscope, Activity, Star, Sparkles
} from 'lucide-react'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/auth-store'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function FloatingIcon({ icon: Icon, className }: { icon: React.ElementType; className?: string }) {
  return (
    <div className={`absolute flex items-center justify-center rounded-2xl glass ${className}`}>
      <Icon className="text-white/50" style={{ width: '50%', height: '50%' }} />
    </div>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [hasError, setHasError] = useState(false)
  const [form, setForm] = useState({ login: '', password: '' })

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (res) => {
      try {
        const { token, user } = res.data.data!
        console.log('Login response:', { user, token: token ? 'exists' : 'missing' })
        
        if (!user || !token) {
          throw new Error('Invalid response: missing user or token')
        }

        login(user, token)
        
        let role = 'patient'
        if (user.role?.role_name) {
          role = user.role.role_name.toLowerCase()
        } else if (user.doctor) {
          role = 'doctor'
        } else if (user.patient) {
          role = 'patient'
        }
        
        console.log('Detected role:', role)
        
        const redirectMap: Record<string, string> = {
          admin: '/admin/dashboard',
          doctor: '/doctor/dashboard',
          patient: '/patient/dashboard',
        }
        
        const redirectPath = redirectMap[role] || '/patient/dashboard'
        console.log('Redirecting to:', redirectPath)
        navigate(redirectPath)
      } catch (error) {
        console.error('Error in login success handler:', error)
        setError('Login berhasil tetapi terjadi kesalahan. Silakan refresh halaman.')
        setHasError(true)
      }
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
    <div className="min-h-screen flex bg-slate-50/50">
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, hsl(220 30% 10%) 0%, hsl(230 35% 6%) 100%)' }}>

        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-32 -right-16 w-[400px] h-[400px] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/3 w-[250px] h-[250px] rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)' }} />

        <div className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }} />

        <FloatingIcon icon={Stethoscope} className="w-20 h-20 top-[12%] right-[15%] float-anim" />
        <FloatingIcon icon={Heart} className="w-16 h-16 top-[38%] left-[10%] float-anim-delay-1" />
        <FloatingIcon icon={Activity} className="w-14 h-14 bottom-[28%] right-[10%] float-anim-delay-2" />
        <FloatingIcon icon={ShieldCheck} className="w-18 h-18 bottom-[12%] left-[15%] float-anim" />

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-xl shadow-sky-500/30 glow-primary">
              <Heart className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">MediQueue</h1>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide">Sistem Antrian Klinik Pintar</p>
            </div>
          </div>

          <div className="space-y-8 max-w-[500px]">
            <div>
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-400 dot-pulse" />
                <span className="text-emerald-300 text-xs font-semibold tracking-wide">SISTEM AKTIF</span>
              </div>
              <h2 className="text-5xl xl:text-6xl font-bold text-white leading-[1.1] tracking-tight">
                Kelola Antrian<br />
                <span className="gradient-text">Lebih Efisien</span>
              </h2>
              <p className="text-slate-400 mt-6 text-lg leading-relaxed">
                Platform terpadu untuk manajemen antrian pasien, jadwal dokter, dan rekam medis digital dengan real-time updates.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: Clock, label: 'Real-time Queue', desc: 'Update otomatis' },
                { icon: ShieldCheck, label: 'Data Aman', desc: 'Enkripsi JWT' },
                { icon: Users, label: 'Multi-Role', desc: 'Admin, Dokter, Pasien' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label}
                  className="glass rounded-xl p-4 group hover:bg-white/10 transition-all duration-300">
                  <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center mb-3 shadow-md shadow-sky-500/20 group-hover:scale-110 transition-transform">
                    <Icon className="size-4 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 pt-2">
              <div className="flex -space-x-2.5">
                {['bg-sky-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500'].map((c, i) => (
                  <div key={i} className={`w-9 h-9 rounded-full ${c} border-2 border-slate-900 flex items-center justify-center`}>
                    <span className="text-white text-[10px] font-bold">{['A', 'D', 'P', '+'][i]}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex text-amber-400 mb-0.5 gap-0.5">
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

      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 60% 40%, rgba(56,189,248,0.04) 0%, transparent 50%)' }} />

        <div className="lg:hidden absolute top-0 left-0 right-0 h-1 gradient-primary" />

        <div className="w-full max-w-[420px] relative z-10 slide-in-bottom">
          <div className="lg:hidden flex items-center gap-3 justify-center mb-10">
            <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-sky-500/25">
              <Heart className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">MediQueue</h1>
              <p className="text-[11px] text-slate-500">Sistem Antrian Klinik</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Selamat Datang</h2>
            <p className="text-slate-500 mt-2">Masuk untuk melanjutkan ke MediQueue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className={`p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-3 ${hasError ? 'shake' : ''}`}>
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold">!</span>
                </div>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="login-input">Email / Username</label>
              <Input
                id="login-input"
                type="text"
                placeholder="email@example.com atau username"
                value={form.login}
                onChange={(e) => setForm({ ...form, login: e.target.value })}
                className="h-12"
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
                  className="h-12 pr-12"
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
              className="w-full h-12 text-base"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <><Loader2 className="size-4 animate-spin mr-2" /> Memproses...</>
              ) : (
                <>Masuk ke Akun <ArrowRight className="size-4 ml-2" /></>
              )}
            </Button>

            <p className="text-center text-sm text-slate-500">
              Belum punya akun?{' '}
              <Link to="/register" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                Daftar sekarang
              </Link>
            </p>
          </form>

          <div className="flex items-center gap-3 my-7">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <Sparkles className="size-3" /> Demo Accounts
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { role: 'Admin', login: 'admin', pass: 'Admin@123', gradient: 'from-sky-500 to-blue-600', bg: 'bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-700' },
              { role: 'Dokter', login: 'drbudi', pass: 'Doctor@123', gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700' },
            ].map(({ role, login, pass, gradient, bg }) => (
              <button
                key={login}
                type="button"
                onClick={() => setForm({ login, password: pass })}
                className={`flex flex-col items-start p-4 rounded-xl border text-xs transition-all hover:shadow-md ${bg}`}
              >
                <div className={`w-7 h-7 rounded-lg bg-linear-to-br ${gradient} flex items-center justify-center mb-2 shadow-sm`}>
                  <span className="text-white text-[10px] font-bold">{role.charAt(0)}</span>
                </div>
                <span className="font-bold text-sm">{role}</span>
                <span className="opacity-60 mt-0.5 truncate w-full text-left">{login}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
