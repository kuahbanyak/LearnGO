import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Heart, Eye, EyeOff, ArrowRight } from 'lucide-react'
import * as Checkbox from '@radix-ui/react-checkbox'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * Login form validation schema.
 * Email is required and must be a valid format.
 * Password is required with minimum 1 character (non-empty).
 */
const loginSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})

type LoginFormData = z.infer<typeof loginSchema>

/**
 * LoginPage — Restyled with "soft machine medical" design system.
 *
 * Features:
 * - Atmospheric background using design tokens (CSS custom properties)
 * - MediQueue brand mark (Heart icon + text)
 * - Display headline using display-lg typography
 * - react-hook-form + zod validation
 * - Non-dismissive inline error (preserves email value)
 * - Loading state on submit with duplicate submission prevention
 * - Link to Register page
 * - "Remember me" checkbox controlling JWT storage strategy
 *
 * Requirements: 2.1, 2.2, 2.3, 2.7, 2.8, 2.9, 27.1
 */
export default function LoginPage() {
  const navigate = useNavigate()
  const { login, setRememberMe } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [rememberMe, setRememberMeLocal] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (res) => {
      try {
        const { token, user } = res.data.data!

        if (!user || !token) {
          throw new Error('Invalid response: missing user or token')
        }

        // Set remember me preference before login so storage backend is correct
        setRememberMe(rememberMe)
        login(user, token)

        // Determine role for redirect
        let role = 'patient'
        if (user.role?.role_name) {
          role = user.role.role_name.toLowerCase()
        } else if (user.doctor) {
          role = 'doctor'
        } else if (user.patient) {
          role = 'patient'
        }

        const redirectMap: Record<string, string> = {
          admin: '/admin/dashboard',
          doctor: '/doctor/dashboard',
          patient: '/patient/dashboard',
        }

        const redirectPath = redirectMap[role] || '/patient/dashboard'
        navigate(redirectPath)
      } catch {
        setServerError('Login berhasil tetapi terjadi kesalahan. Silakan refresh halaman.')
      }
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string }; status?: number } }
      const status = e?.response?.status

      if (status === 401 || status === 403) {
        setServerError('Email atau password salah. Silakan coba lagi.')
      } else if (status === 423) {
        setServerError('Akun Anda terkunci. Hubungi administrator.')
      } else if (status && status >= 500) {
        setServerError('Server tidak tersedia. Silakan coba beberapa saat lagi.')
      } else {
        setServerError(
          e?.response?.data?.message || 'Login gagal. Periksa email dan password Anda.'
        )
      }
    },
  })

  const onSubmit = (data: LoginFormData) => {
    setServerError('')
    // Prevent duplicate submissions — mutation.isPending blocks re-submit
    if (mutation.isPending) return
    mutation.mutate({ login: data.email, password: data.password })
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8"
      style={{
        background: `
          var(--surface-ground)
        `,
      }}
    >
      {/* Atmospheric background layers using design tokens */}
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: `
            radial-gradient(ellipse at 20% 20%, color-mix(in srgb, var(--accent-primary) 6%, transparent) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, color-mix(in srgb, var(--accent-secondary) 4%, transparent) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, color-mix(in srgb, var(--category-doctor) 3%, transparent) 0%, transparent 60%)
          `,
        }}
      />

      <div
        className="w-full max-w-[440px] relative z-10"
        style={{
          background: 'var(--surface-raised)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          padding: 'var(--space-10)',
        }}
      >
        {/* Brand Mark — Heart icon + MediQueue text */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{
              background: 'var(--accent-primary)',
              boxShadow: '0 4px 12px color-mix(in srgb, var(--accent-primary) 30%, transparent)',
            }}
          >
            <Heart className="size-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1
              className="text-xl font-bold"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
            >
              MediQueue
            </h1>
            <p
              className="text-xs"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Sistem Antrian Klinik
            </p>
          </div>
        </div>

        {/* Display Headline — display-lg typography */}
        <h2
          className="text-display-lg mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Selamat Datang
        </h2>
        <p
          className="text-body-md mb-8"
          style={{ color: 'var(--text-secondary)' }}
        >
          Masuk untuk melanjutkan ke MediQueue
        </p>

        {/* Non-dismissive inline error — preserves email value (Req 2.3) */}
        {serverError && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-6 p-4 flex items-start gap-3"
            style={{
              background: 'color-mix(in srgb, var(--accent-danger) 8%, var(--surface-raised))',
              border: '1px solid color-mix(in srgb, var(--accent-danger) 20%, transparent)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-danger)',
            }}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: 'color-mix(in srgb, var(--accent-danger) 15%, transparent)' }}
            >
              <span className="text-xs font-bold" aria-hidden="true">!</span>
            </div>
            <span className="text-sm">{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* Email field */}
          <div className="space-y-2">
            <label
              htmlFor="login-email"
              className="text-label-lg block"
              style={{ color: 'var(--text-primary)' }}
            >
              Email
            </label>
            <Input
              id="login-email"
              type="email"
              placeholder="email@example.com"
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              className="h-12"
              {...register('email')}
            />
            {errors.email && (
              <p
                id="login-email-error"
                className="text-body-sm"
                style={{ color: 'var(--accent-danger)' }}
                role="alert"
              >
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <label
              htmlFor="login-password"
              className="text-label-lg block"
              style={{ color: 'var(--text-primary)' }}
            >
              Password
            </label>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'login-password-error' : undefined}
                className="h-12 pr-12"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && (
              <p
                id="login-password-error"
                className="text-body-sm"
                style={{ color: 'var(--accent-danger)' }}
                role="alert"
              >
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Remember me checkbox — controls JWT storage strategy (Req 27.1) */}
          <div className="flex items-center gap-2">
            <Checkbox.Root
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMeLocal(checked === true)}
              className="w-5 h-5 rounded flex items-center justify-center border-2 transition-colors"
              style={{
                borderColor: rememberMe
                  ? 'var(--accent-primary)'
                  : 'color-mix(in srgb, var(--text-primary) 25%, transparent)',
                background: rememberMe ? 'var(--accent-primary)' : 'transparent',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <Checkbox.Indicator>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2.5 6L5 8.5L9.5 4"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Checkbox.Indicator>
            </Checkbox.Root>
            <label
              htmlFor="remember-me"
              className="text-body-md cursor-pointer select-none"
              style={{ color: 'var(--text-secondary)' }}
            >
              Ingat saya
            </label>
          </div>

          {/* Submit button with loading state and duplicate submission prevention (Req 2.8) */}
          <Button
            type="submit"
            id="login-submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={mutation.isPending}
            disabled={mutation.isPending}
            aria-busy={mutation.isPending}
          >
            {mutation.isPending ? 'Memproses...' : 'Masuk'}
            {!mutation.isPending && <ArrowRight className="size-4 ml-1" aria-hidden="true" />}
          </Button>
        </form>

        {/* Link to Register (Req 2.7) */}
        <p
          className="text-center text-body-md mt-6"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Belum punya akun?{' '}
          <Link
            to="/register"
            className="font-semibold transition-colors"
            style={{ color: 'var(--accent-primary)' }}
          >
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  )
}
