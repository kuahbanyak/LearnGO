import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Heart, Eye, EyeOff, Loader2 } from 'lucide-react'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
      setError(e?.response?.data?.message || 'Login gagal. Periksa email dan password.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    mutation.mutate(form)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
      {/* Decorative blobs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md relative z-10 border-white/10 bg-white/5 backdrop-blur-xl text-white">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-lg">
            <Heart className="size-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">MediQueue</CardTitle>
          <CardDescription className="text-slate-400">
            Sistem Manajemen Klinik Pintar
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Email</label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full gradient-primary border-0 text-white font-semibold py-2.5"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <><Loader2 className="size-4 animate-spin" /> Masuk...</>
              ) : 'Masuk'}
            </Button>

            <p className="text-center text-sm text-slate-400">
              Belum punya akun?{' '}
              <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-medium">
                Daftar sekarang
              </Link>
            </p>

            {/* Demo accounts */}
            <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-slate-400 font-medium mb-2">Demo Accounts:</p>
              <div className="space-y-1 text-xs text-slate-500">
                <p>👑 Admin: admin@mediqueue.com / Admin@123</p>
                <p>🩺 Dokter: doctor@mediqueue.com / Doctor@123</p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
