import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Filter, Users, KeyRound } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useDebouncedSearch } from '@/hooks/use-debounced-search'
import { userApi } from '@/api/users'
import { queryKeys, queryConfig } from '@/lib/query-keys'
import { useAuthStore } from '@/store/auth-store'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, type Column } from '@/components/shared/data-table'
import { ErrorState } from '@/components/shared/error-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { User } from '@/types'

// ── Types ───────────────────────────────────────────────────────────────────

interface CreateUserFormData {
  full_name: string
  email: string
  username: string
  role: string
  password: string
  is_active: boolean
}

interface EditUserFormData {
  role: string
  is_active: boolean
}

const INITIAL_CREATE_FORM: CreateUserFormData = {
  full_name: '',
  email: '',
  username: '',
  role: 'Doctor',
  password: '',
  is_active: true,
}

const ROLE_OPTIONS = ['Admin', 'Doctor'] as const

// ── Helper ──────────────────────────────────────────────────────────────────

function getDisplayName(user: User): string {
  if (user.doctor?.full_name) return user.doctor.full_name
  if (user.patient?.full_name) return user.patient.full_name
  return user.username || user.email
}

function formatLastSignIn(user: User): string {
  // The API doesn't expose last_sign_in directly; show created_at as fallback
  return user.email ? '—' : '—'
}

// ── Create User Modal ───────────────────────────────────────────────────────

interface CreateUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function CreateUserModal({ open, onOpenChange, onSuccess }: CreateUserModalProps) {
  const [form, setForm] = useState<CreateUserFormData>(INITIAL_CREATE_FORM)
  const [error, setError] = useState('')

  const createMutation = useMutation({
    mutationFn: () =>
      userApi.create({
        username: form.username,
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        role: form.role,
        is_active: form.is_active,
      }),
    onSuccess: () => {
      toast.success('Pengguna berhasil ditambahkan')
      onSuccess()
      onOpenChange(false)
      setForm(INITIAL_CREATE_FORM)
      setError('')
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e?.response?.data?.message || 'Gagal menambahkan pengguna')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.full_name.trim() || !form.email.trim() || !form.username.trim()) {
      setError('Nama, email, dan username wajib diisi')
      return
    }
    if (form.password.length < 8) {
      setError('Password minimal 8 karakter')
      return
    }
    createMutation.mutate()
  }

  const updateField = (field: keyof CreateUserFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Pengguna Baru</DialogTitle>
          <DialogDescription>
            Isi data untuk menambahkan pengguna staff baru ke sistem.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              className="p-3 rounded-[var(--radius-md)] text-sm"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent-danger) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--accent-danger) 25%, transparent)',
                color: 'var(--accent-danger)',
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="create-fullname" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Nama Lengkap *
            </label>
            <Input
              id="create-fullname"
              value={form.full_name}
              onChange={(e) => updateField('full_name', e.target.value)}
              required
              placeholder="Nama lengkap"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="create-username" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Username *
            </label>
            <Input
              id="create-username"
              value={form.username}
              onChange={(e) => updateField('username', e.target.value)}
              required
              minLength={3}
              placeholder="username"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="create-email" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Email *
            </label>
            <Input
              id="create-email"
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              required
              placeholder="user@klinik.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="create-role" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Role *
            </label>
            <select
              id="create-role"
              value={form.role}
              onChange={(e) => updateField('role', e.target.value)}
              className="flex w-full h-10 px-4 py-2 text-sm rounded-[var(--radius-md)] bg-[var(--surface-raised)] text-[var(--text-primary)] border-2 border-[color-mix(in_srgb,var(--text-primary)_15%,transparent)] transition-all duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2"
              aria-label="Pilih role"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="create-password" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Password Awal *
            </label>
            <Input
              id="create-password"
              type="password"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              required
              minLength={8}
              placeholder="Minimal 8 karakter"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="create-active"
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => updateField('is_active', e.target.checked)}
              className="h-4 w-4 rounded border-2 border-[color-mix(in_srgb,var(--text-primary)_20%,transparent)] accent-[var(--accent-primary)]"
            />
            <label htmlFor="create-active" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Status Aktif
            </label>
          </div>

          <DialogFooter className="mt-6 gap-3 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" loading={createMutation.isPending}>
              Tambah Pengguna
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Edit User Modal ─────────────────────────────────────────────────────────

interface EditUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  onSuccess: () => void
}

function EditUserModal({ open, onOpenChange, user, onSuccess }: EditUserModalProps) {
  const currentUser = useAuthStore((s) => s.user)
  const [form, setForm] = useState<EditUserFormData>({
    role: user.role?.role_name || 'Doctor',
    is_active: user.is_active,
  })
  const [error, setError] = useState('')
  const [selfDemotionError, setSelfDemotionError] = useState('')

  const isSelf = currentUser?.id === user.id

  const updateMutation = useMutation({
    mutationFn: () =>
      userApi.update(user.id, {
        is_active: form.is_active,
        // Role update is sent as part of the user update
        role_name: form.role,
      } as any),
    onSuccess: () => {
      toast.success('Pengguna berhasil diperbarui')
      onSuccess()
      onOpenChange(false)
      setError('')
      setSelfDemotionError('')
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e?.response?.data?.message || 'Gagal memperbarui pengguna')
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: () =>
      userApi.update(user.id, { password_reset: true } as any),
    onSuccess: () => {
      toast.success('Password berhasil direset', 'Password sementara telah dibuat untuk pengguna ini.')
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error('Gagal reset password', e?.response?.data?.message || 'Terjadi kesalahan')
    },
  })

  const handleRoleChange = (newRole: string) => {
    // Self-demotion prevention: block admin from changing own role to non-Admin
    if (isSelf && newRole !== 'Admin') {
      setSelfDemotionError('Admin tidak dapat mengubah role akun sendiri ke non-Admin. Minta admin lain untuk melakukan perubahan ini.')
      return
    }
    setSelfDemotionError('')
    setForm((prev) => ({ ...prev, role: newRole }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Final self-demotion check before submission
    if (isSelf && form.role !== 'Admin') {
      setSelfDemotionError('Admin tidak dapat mengubah role akun sendiri ke non-Admin.')
      return
    }

    updateMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Pengguna</DialogTitle>
          <DialogDescription>
            Perbarui role dan status pengguna: {getDisplayName(user)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              className="p-3 rounded-[var(--radius-md)] text-sm"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent-danger) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--accent-danger) 25%, transparent)',
                color: 'var(--accent-danger)',
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          {selfDemotionError && (
            <div
              className="p-3 rounded-[var(--radius-md)] text-sm"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent-danger) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--accent-danger) 25%, transparent)',
                color: 'var(--accent-danger)',
              }}
              role="alert"
              aria-live="assertive"
            >
              {selfDemotionError}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="edit-role" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Role
            </label>
            <select
              id="edit-role"
              value={form.role}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="flex w-full h-10 px-4 py-2 text-sm rounded-[var(--radius-md)] bg-[var(--surface-raised)] text-[var(--text-primary)] border-2 border-[color-mix(in_srgb,var(--text-primary)_15%,transparent)] transition-all duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2"
              aria-label="Pilih role"
              aria-describedby={isSelf ? 'self-demotion-hint' : undefined}
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            {isSelf && (
              <p id="self-demotion-hint" className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Anda tidak dapat mengubah role akun Anda sendiri ke non-Admin.
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              id="edit-active"
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
              className="h-4 w-4 rounded border-2 border-[color-mix(in_srgb,var(--text-primary)_20%,transparent)] accent-[var(--accent-primary)]"
            />
            <label htmlFor="edit-active" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Status Aktif
            </label>
          </div>

          {/* Password Reset Action */}
          <div
            className="p-4 rounded-[var(--radius-md)]"
            style={{
              backgroundColor: 'var(--surface-sunken)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Reset Password
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  Buat password sementara baru untuk pengguna ini.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => resetPasswordMutation.mutate()}
                loading={resetPasswordMutation.isPending}
                leftIcon={<KeyRound className="size-3.5" />}
              >
                Reset
              </Button>
            </div>
          </div>

          <DialogFooter className="mt-6 gap-3 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={updateMutation.isPending}
              disabled={!!selfDemotionError}
            >
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Page Component ─────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const queryClient = useQueryClient()

  // Search state with debounce
  const { value: searchValue, debouncedValue: debouncedSearch, setValue: setSearchValue } = useDebouncedSearch()

  // Filter state
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState<string>('')

  // Pagination
  const [page, setPage] = useState(1)
  const perPage = 10

  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  // Fetch users
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...queryKeys.users.all, { page, limit: perPage, offset: (page - 1) * perPage }],
    queryFn: () => userApi.getAll({ limit: perPage, offset: (page - 1) * perPage }),
    staleTime: queryConfig.users.staleTime,
    gcTime: queryConfig.users.gcTime,
  })

  const allUsers: User[] = data?.data?.data?.users ?? []
  const total = data?.data?.data?.total ?? 0
  const totalPages = Math.ceil(total / perPage) || 1

  // Client-side filtering (search + role + active status)
  const filteredUsers = useMemo(() => {
    let result = allUsers

    // Search filter (name or email)
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase()
      result = result.filter(
        (u) =>
          getDisplayName(u).toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query)
      )
    }

    // Role filter
    if (roleFilter) {
      result = result.filter((u) =>
        u.role?.role_name?.toLowerCase() === roleFilter.toLowerCase()
      )
    }

    // Active status filter
    if (activeFilter === 'active') {
      result = result.filter((u) => u.is_active)
    } else if (activeFilter === 'inactive') {
      result = result.filter((u) => !u.is_active)
    }

    return result
  }, [allUsers, debouncedSearch, roleFilter, activeFilter])

  // Reset page when filters change
  const handleRoleFilter = useCallback((value: string) => {
    setRoleFilter(value)
    setPage(1)
  }, [])

  const handleActiveFilter = useCallback((value: string) => {
    setActiveFilter(value)
    setPage(1)
  }, [])

  // Handlers
  const handleCreate = () => {
    setCreateModalOpen(true)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
  }

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
  }

  // Table columns
  const columns: Column<User>[] = [
    {
      key: 'username',
      label: 'Nama',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--category-admin), var(--accent-primary))',
              color: 'var(--text-inverse)',
            }}
          >
            {getDisplayName(row)?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div>
            <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
              {getDisplayName(row)}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {row.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (row) => (
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {row.email}
        </span>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (row) => {
        const roleName = row.role?.role_name?.toLowerCase()
        return (
          <Badge
            variant="secondary"
            className={
              roleName === 'admin'
                ? 'border-[color-mix(in_srgb,var(--category-admin)_30%,transparent)] text-[var(--category-admin)] bg-[color-mix(in_srgb,var(--category-admin)_8%,transparent)]'
                : roleName === 'doctor'
                ? 'border-[color-mix(in_srgb,var(--category-doctor)_30%,transparent)] text-[var(--category-doctor)] bg-[color-mix(in_srgb,var(--category-doctor)_8%,transparent)]'
                : ''
            }
          >
            {row.role?.role_name?.toUpperCase() ?? '—'}
          </Badge>
        )
      },
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.is_active ? 'success' : 'secondary'}>
          {row.is_active ? 'Aktif' : 'Nonaktif'}
        </Badge>
      ),
    },
    {
      key: 'last_sign_in',
      label: 'Login Terakhir',
      render: (row) => (
        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          {formatLastSignIn(row)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      width: '80px',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(row) }}
            className="p-2 rounded-[var(--radius-sm)] transition-colors hover:bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)]"
            aria-label={`Edit ${getDisplayName(row)}`}
            title="Edit"
          >
            <Pencil className="size-4" style={{ color: 'var(--accent-primary)' }} />
          </button>
        </div>
      ),
    },
  ]

  // Error state for fetch failure
  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Manajemen Pengguna"
          subtitle="Kelola akun staff dan hak akses"
          category="admin"
        />
        <ErrorState
          title="Gagal Memuat Data"
          message="Tidak dapat memuat daftar pengguna. Periksa koneksi internet Anda dan coba lagi."
          category="network"
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Pengguna"
        subtitle="Kelola akun staff dan hak akses"
        category="admin"
        actions={
          <Button variant="primary" onClick={handleCreate} leftIcon={<Plus className="size-4" />}>
            Tambah Pengguna
          </Button>
        }
      />

      {/* Filter controls */}
      <div
        className="flex flex-wrap items-center gap-3"
        style={{ marginBottom: 'var(--space-2, 0.5rem)' }}
      >
        <div className="flex items-center gap-2">
          <Filter className="size-4" style={{ color: 'var(--text-tertiary)' }} aria-hidden="true" />
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Filter:
          </span>
        </div>

        {/* Role filter */}
        <select
          value={roleFilter}
          onChange={(e) => handleRoleFilter(e.target.value)}
          className="h-9 px-3 text-sm rounded-[var(--radius-md)] border-2 border-[color-mix(in_srgb,var(--text-primary)_15%,transparent)] bg-[var(--surface-raised)] text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2"
          aria-label="Filter role"
        >
          <option value="">Semua Role</option>
          <option value="Admin">Admin</option>
          <option value="Doctor">Doctor</option>
        </select>

        {/* Active status filter */}
        <select
          value={activeFilter}
          onChange={(e) => handleActiveFilter(e.target.value)}
          className="h-9 px-3 text-sm rounded-[var(--radius-md)] border-2 border-[color-mix(in_srgb,var(--text-primary)_15%,transparent)] bg-[var(--surface-raised)] text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2"
          aria-label="Filter status aktif"
        >
          <option value="">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>

        {/* Clear filters */}
        {(roleFilter || activeFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setRoleFilter('')
              setActiveFilter('')
              setPage(1)
            }}
          >
            Reset Filter
          </Button>
        )}
      </div>

      {/* Data Table */}
      <DataTable<User>
        columns={columns}
        data={filteredUsers}
        loading={isLoading}
        pagination={{
          page,
          totalPages,
          onPageChange: setPage,
        }}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Cari nama atau email..."
        emptyState={
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="size-12 mb-4 opacity-20" style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Tidak ada pengguna ditemukan
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              {debouncedSearch || roleFilter || activeFilter
                ? 'Coba ubah kata kunci pencarian atau filter.'
                : 'Tambahkan pengguna baru untuk memulai.'}
            </p>
            {!debouncedSearch && !roleFilter && !activeFilter && (
              <Button variant="primary" size="sm" className="mt-4" onClick={handleCreate} leftIcon={<Plus className="size-4" />}>
                Tambah Pengguna
              </Button>
            )}
          </div>
        }
      />

      {/* Create Modal */}
      <CreateUserModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleFormSuccess}
      />

      {/* Edit Modal */}
      {editingUser && (
        <EditUserModal
          open={!!editingUser}
          onOpenChange={(open) => { if (!open) setEditingUser(null) }}
          user={editingUser}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}
