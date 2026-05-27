import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Heart, ArrowRight, User, Mail, Phone, Lock, Calendar, CreditCard,
  ShieldCheck, Clock, Users
} from 'lucide-react'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/auth-store'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Registration form schema with password complexity validation
// Validates: Requirements 2.4, 2.5
const registerSchema = z.object({
  full_name: z.string().min(1, 'Nama lengkap wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  phone: z.string().min(1, 'Nomor telepon wajib diisi'),
  date_of_birth: z.string().min(1, 'Tanggal lahir wajib diisi'),
  nik: z.string().refine(
    (val) => val === '' || (val.length >= 10 && val.length <= 16),
    { message: 'NIK harus 10-16 digit' }
  ).optional(),
  password: z.string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[a-zA-Z]/, 'Password harus mengandung minimal satu huruf')
    .regex(/[0-9]/, 'Password harus mengandung minimal satu angka'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [error, setError] = useState('')
  const [hasError, setHasError] = useState(false)
  const isSubmittingRef = useRef(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      password: '',
      confirmPassword: '',
    },
  })

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (res) => {
      isSubmittingRef.current = false
      try {
        const data = res.data.data as unknown
        const record = data as Record<string, unknown> | null
        if (record && 'token' in record) {
          const token = record.token as string
          const user = record.user as Parameters<typeof login>[0]
          login(user, token)
        } else if (record) {
          // If API returns user without token, store session and redirect
          login(record as unknown as Parameters<typeof login>[0], '')
        }
        toast.success('Registrasi berhasil!', 'Selamat datang di MediQueue.')
        navigate('/patient/dashboard')
      } catch {
        // Fallback: redirect to login if session storage fails
        toast.success('Registrasi berhasil!', 'Silakan login dengan akun Anda.')
        navigate('/login')
      }
    },
    onError: (err: unknown) => {
      isSubmittingRef.current = false
      const e = err as { response?: { data?: { message?: string } } }
      const msg = e?.response?.data?.message || 'Registrasi gagal. Silakan coba lagi.'
      setError(msg)
      setHasError(true)
      toast.error('Registrasi gagal', msg)
      setTimeout(() => setHasError(false), 500)
    },
  })

  const onSubmit = (data: RegisterFormData) => {
    // Prevent duplicate submissions (Requirement 2.8)
    if (isSubmittingRef.current || mutation.isPending) return
    isSubmittingRef.current = true
    setError('')

    mutation.mutate({
      username: data.email.split('@')[0],
      email: data.email,
      password: data.password,
      full_name: data.full_name,
      phone: data.phone,
      date_of_birth: data.date_of_birth,
      nik: data.nik,
    })
  }

  return (
    <div className="min-h-screen flex bg-slate-50/50">
      {/* Left Panel - Atmospheric Background with Brand Mark */}
      <div
        className="hidden lg:flex lg:w-[55%] relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, hsl(220 30% 10%) 0%, hsl(230 35% 6%) 100%)' }}
      >
        {/* Atmospheric background blobs using design tokens */}
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-32 -right-16 w-[400px] h-[400px] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 left-1/3 w-[250px] h-[250px] rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)' }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
          {/* Brand Mark (Requirement 2.9) */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-xl shadow-sky-500/30 glow-primary">
              <Heart className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">MediQueue</h1>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide">Sistem Antrian Klinik Pintar</p>
            </div>
          </div>

          {/* Display Headline (Requirement 2.9 - display typography scale) */}
          <div className="space-y-8 max-w-[500px]">
            <div>
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-400 dot-pulse" />
                <span className="text-emerald-300 text-xs font-semibold tracking-wide">PENDAFTARAN TERBUKA</span>
              </div>
              <h2 className="text-5xl xl:text-6xl font-bold text-white leading-[1.1] tracking-tight">
                Bergabung dengan
                <br />
                <span className="gradient-text">MediQueue</span>
              </h2>
              <p className="text-slate-400 mt-6 text-lg leading-relaxed">
                Daftarkan diri Anda untuk menikmati kemudahan pendaftaran antrian dokter secara online.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: Clock, label: 'Antrian Online', desc: 'Tanpa menunggu lama' },
                { icon: ShieldCheck, label: 'Data Aman', desc: 'Privasi terjaga' },
                { icon: Users, label: 'Mudah Digunakan', desc: 'Proses cepat' },
              ].map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="glass rounded-xl p-4 group hover:bg-white/10 transition-all duration-300"
                >
                  <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center mb-3 shadow-md shadow-sky-500/20 group-hover:scale-110 transition-transform">
                    <Icon className="size-4 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <p className="text-xs text-slate-700 font-medium">
            © 2026 MediQueue · Capstone Project · v1.0.0
          </p>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-10 relative overflow-hidden">
        {/* Subtle radial background */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 60% 40%, rgba(56,189,248,0.04) 0%, transparent 50%)' }}
        />

        {/* Mobile gradient accent bar */}
        <div className="lg:hidden absolute top-0 left-0 right-0 h-1 gradient-primary" />

        <div className="w-full max-w-[420px] relative z-10 slide-in-bottom">
          {/* Mobile Brand Mark */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-10">
            <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-sky-500/25">
              <Heart className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">MediQueue</h1>
              <p className="text-[11px] text-slate-500">Sistem Antrian Klinik</p>
            </div>
          </div>

          {/* Header with display headline */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Buat Akun Baru</h2>
            <p className="text-slate-500 mt-2">Daftarkan diri Anda untuk menggunakan MediQueue</p>
          </div>

          {/* Registration Form with react-hook-form + zod */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* API Error Display */}
            {error && (
              <div
                className={`p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-3 ${hasError ? 'shake' : ''}`}
                role="alert"
              >
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold">!</span>
                </div>
                <span>{error}</span>
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-1.5">
              <label htmlFor="register-fullname" className="text-sm font-semibold text-slate-700">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  id="register-fullname"
                  type="text"
                  placeholder="John Doe"
                  className="pl-10"
                  aria-invalid={!!errors.full_name}
                  aria-describedby={errors.full_name ? 'fullname-error' : undefined}
                  {...register('full_name')}
                />
              </div>
              {errors.full_name && (
                <p id="fullname-error" className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="register-email" className="text-sm font-semibold text-slate-700">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  id="register-email"
                  type="email"
                  placeholder="email@example.com"
                  className="pl-10"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="text-xs text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label htmlFor="register-phone" className="text-sm font-semibold text-slate-700">
                No. Telepon
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  id="register-phone"
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  className="pl-10"
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                  {...register('phone')}
                />
              </div>
              {errors.phone && (
                <p id="phone-error" className="text-xs text-red-500 mt-1">{errors.phone.message}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div className="space-y-1.5">
              <label htmlFor="register-dob" className="text-sm font-semibold text-slate-700">
                Tanggal Lahir
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  id="register-dob"
                  type="date"
                  className="pl-10"
                  aria-invalid={!!errors.date_of_birth}
                  aria-describedby={errors.date_of_birth ? 'dob-error' : undefined}
                  {...register('date_of_birth')}
                />
              </div>
              {errors.date_of_birth && (
                <p id="dob-error" className="text-xs text-red-500 mt-1">{errors.date_of_birth.message}</p>
              )}
            </div>

            {/* NIK */}
            <div className="space-y-1.5">
              <label htmlFor="register-nik" className="text-sm font-semibold text-slate-700">
                NIK (Opsional)
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  id="register-nik"
                  type="text"
                  placeholder="Minimal 10 digit"
                  className="pl-10"
                  aria-invalid={!!errors.nik}
                  aria-describedby={errors.nik ? 'nik-error' : undefined}
                  {...register('nik')}
                />
              </div>
              {errors.nik && (
                <p id="nik-error" className="text-xs text-red-500 mt-1">{errors.nik.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="register-password" className="text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  id="register-password"
                  type="password"
                  placeholder="Minimal 8 karakter"
                  className="pl-10"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p id="password-error" className="text-xs text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Password Confirmation */}
            <div className="space-y-1.5">
              <label htmlFor="register-confirm" className="text-sm font-semibold text-slate-700">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  id="register-confirm"
                  type="password"
                  placeholder="Ulangi password"
                  className="pl-10"
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
                  {...register('confirmPassword')}
                />
              </div>
              {errors.confirmPassword && (
                <p id="confirm-error" className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit Button with loading state and duplicate prevention (Requirement 2.8) */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              disabled={mutation.isPending}
              loading={mutation.isPending}
            >
              {mutation.isPending ? 'Mendaftar...' : 'Daftar Sekarang'}
              {!mutation.isPending && <ArrowRight className="size-4 ml-1" />}
            </Button>

            {/* Link to Login (Requirement 2.7) */}
            <p className="text-center text-sm text-slate-500">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                Masuk
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
