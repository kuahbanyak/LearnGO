import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Filter, UserCog } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/hooks/use-toast'
import { useDebouncedSearch } from '@/hooks/use-debounced-search'
import { doctorApi } from '@/api/doctors'
import { queryKeys, queryConfig } from '@/lib/query-keys'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, type Column } from '@/components/shared/data-table'
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog'
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
import type { Doctor } from '@/types'

// ── Types ───────────────────────────────────────────────────────────────────

interface DoctorFormData {
  username: string
  email: string
  password: string
  full_name: string
  phone: string
  specialization: string
  sip_number: string
  description: string
  is_active: boolean
}

const INITIAL_FORM: DoctorFormData = {
  username: '',
  email: '',
  password: '',
  full_name: '',
  phone: '',
  specialization: '',
  sip_number: '',
  description: '',
  is_active: true,
}

// ── Doctor Form Modal ───────────────────────────────────────────────────────

interface DoctorFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  doctor: Doctor | null
  onSuccess: () => void
}

function DoctorFormModal({ open, onOpenChange, doctor, onSuccess }: DoctorFormModalProps) {
  const isEditing = !!doctor
  const [form, setForm] = useState<DoctorFormData>(() =>
    doctor
      ? {
          username: doctor.user?.username ?? '',
          email: doctor.user?.email ?? '',
          password: '',
          full_name: doctor.full_name ?? '',
          phone: doctor.phone ?? '',
          specialization: doctor.specialization ?? '',
          sip_number: doctor.sip_number ?? '',
          description: '',
          is_active: true,
        }
      : INITIAL_FORM
  )
  const [error, setError] = useState('')

  const createMutation = useMutation({
    mutationFn: doctorApi.create,
    onSuccess: () => {
      toast.success('Dokter berhasil ditambahkan')
      onSuccess()
      onOpenChange(false)
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      const msg = e?.response?.data?.message || 'Gagal menambahkan dokter'
      setError(msg)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof doctorApi.update>[1] }) =>
      doctorApi.update(id, data),
    onSuccess: () => {
      toast.success('Data dokter berhasil diperbarui')
      onSuccess()
      onOpenChange(false)
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      const msg = e?.response?.data?.message || 'Gagal memperbarui dokter'
      setError(msg)
    },
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (isEditing && doctor) {
      updateMutation.mutate({
        id: doctor.id,
        data: {
          full_name: form.full_name,
          phone: form.phone,
          specialization: form.specialization,
          sip_number: form.sip_number,
        },
      })
    } else {
      createMutation.mutate({
        username: form.username,
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        phone: form.phone,
        specialization: form.specialization,
        sip_number: form.sip_number,
      })
    }
  }

  const updateField = (field: keyof DoctorFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Dokter' : 'Tambah Dokter Baru'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Perbarui informasi profil dokter.'
              : 'Isi data untuk menambahkan dokter baru ke sistem.'}
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

          {/* Account fields — only for create */}
          {!isEditing && (
            <>
              <div className="space-y-1.5">
                <label htmlFor="doctor-username" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Username *
                </label>
                <Input
                  id="doctor-username"
                  value={form.username}
                  onChange={(e) => updateField('username', e.target.value)}
                  required
                  minLength={3}
                  placeholder="username"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="doctor-email" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Email *
                </label>
                <Input
                  id="doctor-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  required
                  placeholder="dokter@klinik.com"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="doctor-password" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Password *
                </label>
                <Input
                  id="doctor-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  required
                  minLength={8}
                  placeholder="Minimal 8 karakter"
                />
              </div>
            </>
          )}

          {/* Profile fields */}
          <div className="space-y-1.5">
            <label htmlFor="doctor-fullname" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Nama Lengkap *
            </label>
            <Input
              id="doctor-fullname"
              value={form.full_name}
              onChange={(e) => updateField('full_name', e.target.value)}
              required
              placeholder="Dr. Nama Lengkap"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="doctor-specialization" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Spesialisasi *
            </label>
            <Input
              id="doctor-specialization"
              value={form.specialization}
              onChange={(e) => updateField('specialization', e.target.value)}
              required
              placeholder="Umum, Gigi, Anak, dll."
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="doctor-sip" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Nomor SIP (Lisensi) *
            </label>
            <Input
              id="doctor-sip"
              value={form.sip_number}
              onChange={(e) => updateField('sip_number', e.target.value)}
              required
              placeholder="SIP-XXX/XXXX"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="doctor-phone" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              No. Telepon
            </label>
            <Input
              id="doctor-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="doctor-description" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Deskripsi
            </label>
            <textarea
              id="doctor-description"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Deskripsi singkat tentang dokter..."
              rows={3}
              className="flex w-full px-4 py-3 text-sm rounded-[var(--radius-md)] bg-[var(--surface-raised)] text-[var(--text-primary)] border-2 border-[color-mix(in_srgb,var(--text-primary)_15%,transparent)] placeholder:text-[var(--text-tertiary)] transition-all duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:border-[var(--accent-primary)] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="doctor-active"
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => updateField('is_active', e.target.checked)}
              className="h-4 w-4 rounded border-2 border-[color-mix(in_srgb,var(--text-primary)_20%,transparent)] accent-[var(--accent-primary)]"
            />
            <label htmlFor="doctor-active" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Status Aktif
            </label>
          </div>

          <DialogFooter className="mt-6 gap-3 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" loading={isPending}>
              {isEditing ? 'Simpan Perubahan' : 'Tambah Dokter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Delete Error State ──────────────────────────────────────────────────────

interface DeleteErrorProps {
  onDismiss: () => void
  onNavigate: () => void
}

function DeleteErrorPanel({ onDismiss, onNavigate }: DeleteErrorProps) {
  return (
    <div
      className="rounded-[var(--radius-lg)] p-6"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--accent-danger) 6%, transparent)',
        border: '1px solid color-mix(in srgb, var(--accent-danger) 20%, transparent)',
      }}
    >
      <ErrorState
        title="Tidak Dapat Menghapus Dokter"
        message="Dokter ini memiliki janji temu aktif yang belum selesai. Selesaikan atau batalkan janji temu terlebih dahulu sebelum menghapus dokter."
        category="validation"
        onRetry={onDismiss}
        retryLabel="Tutup"
      />
      <div className="flex justify-center mt-4">
        <Button variant="outline" size="sm" onClick={onNavigate}>
          Lihat Janji Temu Terkait
        </Button>
      </div>
    </div>
  )
}

// ── Main Page Component ─────────────────────────────────────────────────────

export default function AdminDoctorsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Search state with debounce
  const { value: searchValue, debouncedValue: debouncedSearch, setValue: setSearchValue } = useDebouncedSearch()

  // Filter state
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState<string>('')

  // Pagination
  const [page, setPage] = useState(1)
  const perPage = 10

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Doctor | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<Doctor | null>(null)

  // Fetch doctors
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...queryKeys.doctors.all, { page, per_page: perPage }],
    queryFn: () => doctorApi.getAll({ page, per_page: perPage }),
    staleTime: queryConfig.doctors.staleTime,
    gcTime: queryConfig.doctors.gcTime,
  })

  const allDoctors: Doctor[] = data?.data?.data ?? []
  const totalPages = data?.data?.meta?.total_pages ?? 1

  // Extract unique specialties for filter dropdown
  const specialties = useMemo(() => {
    const set = new Set<string>()
    allDoctors.forEach((d) => {
      if (d.specialization) set.add(d.specialization)
    })
    return Array.from(set).sort()
  }, [allDoctors])

  // Client-side filtering (search + specialty + active status)
  const filteredDoctors = useMemo(() => {
    let result = allDoctors

    // Search filter (name or specialty)
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase()
      result = result.filter(
        (d) =>
          d.full_name?.toLowerCase().includes(query) ||
          d.specialization?.toLowerCase().includes(query)
      )
    }

    // Specialty filter
    if (specialtyFilter) {
      result = result.filter((d) => d.specialization === specialtyFilter)
    }

    // Active status filter
    if (activeFilter === 'active') {
      result = result.filter((d) => d.user?.is_active !== false)
    } else if (activeFilter === 'inactive') {
      result = result.filter((d) => d.user?.is_active === false)
    }

    return result
  }, [allDoctors, debouncedSearch, specialtyFilter, activeFilter])

  // Reset page when filters change
  const handleSpecialtyFilter = useCallback((value: string) => {
    setSpecialtyFilter(value)
    setPage(1)
  }, [])

  const handleActiveFilter = useCallback((value: string) => {
    setActiveFilter(value)
    setPage(1)
  }, [])

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: doctorApi.delete,
    onSuccess: () => {
      toast.success('Dokter berhasil dihapus')
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all })
      setDeleteConfirmOpen(false)
      setDeleteTarget(null)
    },
    onError: (err: unknown) => {
      const e = err as { response?: { status?: number; data?: { message?: string } } }
      setDeleteConfirmOpen(false)

      // Check if failure is due to active appointments constraint
      if (e?.response?.status === 409 || e?.response?.status === 400) {
        setDeleteError(deleteTarget)
      } else {
        toast.error(e?.response?.data?.message || 'Gagal menghapus dokter')
      }
    },
  })

  // Handlers
  const handleCreate = () => {
    setEditingDoctor(null)
    setModalOpen(true)
  }

  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor)
    setModalOpen(true)
  }

  const handleDeleteRequest = (doctor: Doctor) => {
    setDeleteTarget(doctor)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id)
    }
  }

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all })
  }

  const handleNavigateToAppointments = () => {
    if (deleteError) {
      navigate(`/admin/appointments?doctor_id=${deleteError.id}`)
    }
    setDeleteError(null)
  }

  // Table columns
  const columns: Column<Doctor>[] = [
    {
      key: 'full_name',
      label: 'Nama',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--category-doctor), var(--accent-primary))',
              color: 'var(--text-inverse)',
            }}
          >
            {row.full_name?.charAt(0)?.toUpperCase() ?? 'D'}
          </div>
          <div>
            <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
              {row.full_name}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {row.user?.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'specialization',
      label: 'Spesialisasi',
      sortable: true,
      render: (row) => (
        <Badge variant="secondary">{row.specialization}</Badge>
      ),
    },
    {
      key: 'sip_number',
      label: 'No. SIP',
      render: (row) => (
        <span className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
          {row.sip_number}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (row) => {
        const isActive = row.user?.is_active !== false
        return (
          <Badge variant={isActive ? 'success' : 'secondary'}>
            {isActive ? 'Aktif' : 'Nonaktif'}
          </Badge>
        )
      },
    },
    {
      key: 'actions',
      label: 'Aksi',
      width: '100px',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(row) }}
            className="p-2 rounded-[var(--radius-sm)] transition-colors hover:bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)]"
            aria-label={`Edit ${row.full_name}`}
            title="Edit"
          >
            <Pencil className="size-4" style={{ color: 'var(--accent-primary)' }} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDeleteRequest(row) }}
            className="p-2 rounded-[var(--radius-sm)] transition-colors hover:bg-[color-mix(in_srgb,var(--accent-danger)_10%,transparent)]"
            aria-label={`Hapus ${row.full_name}`}
            title="Hapus"
          >
            <Trash2 className="size-4" style={{ color: 'var(--accent-danger)' }} />
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
          title="Data Dokter"
          subtitle="Kelola profil dan spesialisasi dokter"
          category="admin"
        />
        <ErrorState
          title="Gagal Memuat Data"
          message="Tidak dapat memuat daftar dokter. Periksa koneksi internet Anda dan coba lagi."
          category="network"
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Dokter"
        subtitle="Kelola profil dan spesialisasi dokter"
        category="admin"
        actions={
          <Button variant="primary" onClick={handleCreate} leftIcon={<Plus className="size-4" />}>
            Tambah Dokter
          </Button>
        }
      />

      {/* Delete error panel */}
      {deleteError && (
        <DeleteErrorPanel
          onDismiss={() => setDeleteError(null)}
          onNavigate={handleNavigateToAppointments}
        />
      )}

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

        {/* Specialty filter */}
        <select
          value={specialtyFilter}
          onChange={(e) => handleSpecialtyFilter(e.target.value)}
          className="h-9 px-3 text-sm rounded-[var(--radius-md)] border-2 border-[color-mix(in_srgb,var(--text-primary)_15%,transparent)] bg-[var(--surface-raised)] text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2"
          aria-label="Filter spesialisasi"
        >
          <option value="">Semua Spesialisasi</option>
          {specialties.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
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
        {(specialtyFilter || activeFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSpecialtyFilter('')
              setActiveFilter('')
              setPage(1)
            }}
          >
            Reset Filter
          </Button>
        )}
      </div>

      {/* Data Table */}
      <DataTable<Doctor>
        columns={columns}
        data={filteredDoctors}
        loading={isLoading}
        pagination={{
          page,
          totalPages,
          onPageChange: setPage,
        }}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Cari nama atau spesialisasi..."
        emptyState={
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <UserCog className="size-12 mb-4 opacity-20" style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Tidak ada dokter ditemukan
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              {debouncedSearch || specialtyFilter || activeFilter
                ? 'Coba ubah kata kunci pencarian atau filter.'
                : 'Tambahkan dokter baru untuk memulai.'}
            </p>
            {!debouncedSearch && !specialtyFilter && !activeFilter && (
              <Button variant="primary" size="sm" className="mt-4" onClick={handleCreate} leftIcon={<Plus className="size-4" />}>
                Tambah Dokter
              </Button>
            )}
          </div>
        }
      />

      {/* Create/Edit Modal */}
      {modalOpen && (
        <DoctorFormModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          doctor={editingDoctor}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Hapus Dokter"
        message={`Apakah Anda yakin ingin menghapus ${deleteTarget?.full_name ?? 'dokter ini'}? Tindakan ini akan mempengaruhi jadwal dan janji temu yang terkait dengan dokter ini. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setDeleteConfirmOpen(false); setDeleteTarget(null) }}
        loading={deleteMutation.isPending}
        destructive
      />
    </div>
  )
}
