import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Users as UsersIcon, Loader2, Edit, Trash2, Shield } from 'lucide-react'
import { userApi } from '@/api/users'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import type { User } from '@/types'

function UserEditModal({ user, onClose }: { user: User; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    phone: user.phone || '',
    nik: user.nik || '',
    gender: user.gender || '',
    address: user.address || '',
    blood_type: user.blood_type || '',
    is_active: user.is_active
  })

  const updateMutation = useMutation({
    mutationFn: () => userApi.update(user.id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Berhasil', 'Pengguna berhasil diperbarui')
      onClose()
    },
    onError: (err: any) => {
      toast.error('Gagal', err.response?.data?.message || 'Terjadi kesalahan')
    }
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 modal-overlay">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg modal-content flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Edit Pengguna</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">✕</button>
        </div>
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nama Lengkap</label>
            <Input value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nomor HP</label>
            <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">NIK</label>
            <Input value={formData.nik} onChange={e => setFormData({ ...formData, nik: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Jenis Kelamin</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                <option value="">Pilih</option>
                <option value="male">Laki-laki</option>
                <option value="female">Perempuan</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Golongan Darah</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.blood_type} onChange={e => setFormData({ ...formData, blood_type: e.target.value })}>
                <option value="">Pilih</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Alamat</label>
            <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="is_active" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
            <label htmlFor="is_active" className="text-sm font-medium">Akun Aktif</label>
          </div>
        </div>
        <div className="px-6 py-4 border-t flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button className="gradient-primary text-white border-0" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            Simpan Perubahan
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: () => userApi.getAll({ limit: 10, offset: (page - 1) * 10 }),
    staleTime: 30000,
  })

  const deleteMutation = useMutation({
    mutationFn: userApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Berhasil', 'Pengguna berhasil dihapus')
    },
    onError: (err: any) => {
      toast.error('Gagal', err.response?.data?.message || 'Terjadi kesalahan')
    }
  })

  const users = data?.data?.data?.users ?? []
  const total = data?.data?.data?.total ?? 0
  const totalPages = Math.ceil(total / 10) || 1

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus pengguna ${name}? Tindakan ini tidak dapat dibatalkan.`)) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Manajemen Pengguna</h1>
        <p className="text-slate-500 mt-1">Kelola data seluruh akun pengguna di sistem</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="size-4" />
            {total} Pengguna Terdaftar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : users.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <UsersIcon className="size-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Tidak ada pengguna ditemukan</p>
            </div>
          ) : (
            <div className="divide-y overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 bg-slate-50 uppercase">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Pengguna</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right rounded-r-lg">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((u: User) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {u.full_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{u.full_name}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={
                          u.role === 'admin' ? 'border-red-200 text-red-600 bg-red-50' :
                            u.role === 'doctor' ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : ''
                        }>
                          {u.role.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.is_active ? 'default' : 'secondary'}>
                          {u.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="p-1.5 rounded text-blue-500 hover:bg-blue-50 transition-colors"
                            title="Edit pengguna"
                          >
                            <Edit className="size-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(u.id, u.full_name)}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 rounded text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Hapus pengguna"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Halaman {page} dari {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                  ← Sebelumnya
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                  Berikutnya →
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedUser && (
        <UserEditModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  )
}
