import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Heart, Loader2 } from 'lucide-react'
import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    email: '', password: '', full_name: '', phone: ''
  })

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      navigate('/login', { state: { message: 'Registrasi berhasil! Silakan login.' } })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e?.response?.data?.message || 'Registrasi gagal.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    mutation.mutate(form)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md relative z-10 border-white/10 bg-white/5 backdrop-blur-xl text-white">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-lg">
            <Heart className="size-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Daftar Akun Pasien</CardTitle>
          <CardDescription className="text-slate-400">
            Daftarkan diri Anda untuk menggunakan MediQueue
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                {error}
              </div>
            )}

            {[
              { label: 'Nama Lengkap', field: 'full_name', type: 'text', placeholder: 'John Doe' },
              { label: 'Email', field: 'email', type: 'email', placeholder: 'email@example.com' },
              { label: 'No. Telepon', field: 'phone', type: 'tel', placeholder: '08xxxxxxxxxx' },
              { label: 'Password', field: 'password', type: 'password', placeholder: '••••••••' },
            ].map(({ label, field, type, placeholder }) => (
              <div key={field} className="space-y-2">
                <label className="text-sm font-medium text-slate-300">{label}</label>
                <Input
                  type={type}
                  placeholder={placeholder}
                  value={form[field as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500"
                  required={field !== 'phone'}
                  minLength={field === 'password' ? 8 : undefined}
                />
              </div>
            ))}

            <Button
              type="submit"
              className="w-full gradient-primary border-0 text-white font-semibold py-2.5"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <><Loader2 className="size-4 animate-spin" /> Mendaftar...</>
              ) : 'Daftar Sekarang'}
            </Button>

            <p className="text-center text-sm text-slate-400">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
                Masuk
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
