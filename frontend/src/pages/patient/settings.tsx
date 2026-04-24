import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/auth-store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { Loader2, Save, UserCircle, Trash2, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function PatientSettingsPage() {
  const { user, updateUser, logout } = useAuthStore()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    nik: user?.nik || '',
    gender: user?.gender || '',
    address: user?.address || '',
    blood_type: user?.blood_type || '',
  })

  const updateMutation = useMutation({
    mutationFn: () => authApi.updateProfile(formData),
    onSuccess: (res) => {
      if (res.data?.data) {
        updateUser(res.data.data)
      }
      toast.success('Profil Diperbarui', 'Data diri Anda berhasil disimpan')
    },
    onError: (err: any) => {
      toast.error('Gagal', err.response?.data?.message || 'Gagal memperbarui profil')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: () => authApi.deleteProfile(),
    onSuccess: () => {
      toast.success('Berhasil', 'Akun Anda telah berhasil dihapus')
      logout()
      navigate('/login')
    },
    onError: (err: any) => {
      toast.error('Gagal', err.response?.data?.message || 'Gagal menghapus akun')
    }
  })

  const handleDeleteAccount = () => {
    if (confirm('Apakah Anda yakin ingin menghapus akun ini secara permanen? Semua riwayat medis dan antrian Anda mungkin tidak dapat diakses lagi. Tindakan ini tidak dapat dibatalkan.')) {
      deleteMutation.mutate()
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Pengaturan Profil</h1>
        <p className="text-slate-500 mt-1">Lengkapi data diri Anda untuk keperluan pendaftaran antrian</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCircle className="size-5 text-primary" />
            Informasi Pribadi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Lengkap</label>
              <Input 
                value={formData.full_name} 
                onChange={e => setFormData({ ...formData, full_name: e.target.value })} 
                placeholder="Masukkan nama lengkap"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nomor Handphone</label>
              <Input 
                value={formData.phone} 
                onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                placeholder="081234567890"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">NIK (Nomor Induk Kependudukan)</label>
              <Input 
                value={formData.nik} 
                onChange={e => setFormData({ ...formData, nik: e.target.value })} 
                placeholder="Masukkan 16 digit NIK"
                maxLength={16}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Jenis Kelamin</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.gender} 
                onChange={e => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="">Pilih Jenis Kelamin</option>
                <option value="male">Laki-laki</option>
                <option value="female">Perempuan</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Golongan Darah</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.blood_type} 
                onChange={e => setFormData({ ...formData, blood_type: e.target.value })}
              >
                <option value="">Pilih Golongan Darah</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Alamat Lengkap</label>
              <Input 
                value={formData.address} 
                onChange={e => setFormData({ ...formData, address: e.target.value })} 
                placeholder="Masukkan alamat lengkap Anda"
              />
            </div>
          </div>

          <div className="pt-4 border-t mt-6 flex justify-end">
            <Button 
              onClick={() => updateMutation.mutate()} 
              disabled={updateMutation.isPending}
              className="gradient-primary text-white border-0"
            >
              {updateMutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
              Simpan Profil
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-red-600">
            <AlertTriangle className="size-5" />
            Zona Bahaya
          </CardTitle>
          <CardDescription className="text-red-600/80">
            Tindakan di area ini bersifat permanen dan tidak dapat dibatalkan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-sm text-red-900">
              Menghapus akun akan menghilangkan akses Anda ke seluruh sistem, riwayat antrian, dan fitur lainnya secara permanen.
            </div>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              disabled={deleteMutation.isPending}
              className="shrink-0"
            >
              {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : <Trash2 className="size-4 mr-2" />}
              Hapus Akun Permanen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
