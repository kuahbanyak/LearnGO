import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Download, Pencil, Users, ArrowLeft, Calendar, FileText, Clock } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useDebouncedSearch } from '@/hooks/use-debounced-search'
import { patientApi } from '@/api/dashboard'
import { queryKeys, queryConfig } from '@/lib/query-keys'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, type Column } from '@/components/shared/data-table'
import { ErrorState } from '@/components/shared/error-state'
import { EmptyState } from '@/components/shared/empty-state'
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
import apiClient from '@/api/client'
import { formatDate } from '@/lib/utils'
import type { Patient, Appointment, MedicalRecord } from '@/types'

// ── Types ───────────────────────────────────────────────────────────────────

type DetailView = 'profile' | 'appointments' | 'records' | 'queue'

interface PatientEditFormData {
  full_name: string
  phone: string
  address: string
  allergies: string
}

// ── Tooltip Component (inline) ──────────────────────────────────────────────

function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  return (
    <span className="relative group inline-block">
      {children}
      <span
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs rounded-[var(--radius-sm)] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50"
        style={{
          backgroundColor: 'var(--text-primary, #1a1714)',
          color: 'var(--surface-base, #fff)',
        }}
        role="tooltip"
      >
        {content}
      </span>
    </span>
  )
}

// ── Patient Edit Modal ──────────────────────────────────────────────────────

interface PatientEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patient: Patient
  onSuccess: () => void
}

function PatientEditModal({ open, onOpenChange, patient, onSuccess }: PatientEditModalProps) {
  const [form, setForm] = useState<PatientEditFormData>({
    full_name: patient.full_name ?? patient.user?.full_name ?? '',
    phone: patient.phone ?? patient.user?.phone ?? '',
    address: patient.address ?? '',
    allergies: patient.allergies ?? '',
  })
  const [error, setError] = useState('')

  const updateMutation = useMutation({
    mutationFn: (data: Partial<PatientEditFormData>) =>
      apiClient.put(`/patients/${patient.id}`, data),
    onSuccess: () => {
      toast.success('Data pasien berhasil diperbarui')
      onSuccess()
      onOpenChange(false)
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e?.response?.data?.message || 'Gagal memperbarui data pasien')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    updateMutation.mutate(form)
  }

  const updateField = (field: keyof PatientEditFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Data Pasien</DialogTitle>
          <DialogDescription>
            Perbarui informasi profil pasien. Beberapa field tidak dapat diubah.
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

          {/* Editable fields */}
          <div className="space-y-1.5">
            <label htmlFor="patient-name" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Nama Lengkap
            </label>
            <Input
              id="patient-name"
              value={form.full_name}
              onChange={(e) => updateField('full_name', e.target.value)}
              placeholder="Nama lengkap pasien"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="patient-phone" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              No. Telepon
            </label>
            <Input
              id="patient-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="patient-address" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Alamat
            </label>
            <Input
              id="patient-address"
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="Alamat lengkap"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="patient-allergies" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Alergi
            </label>
            <Input
              id="patient-allergies"
              value={form.allergies}
              onChange={(e) => updateField('allergies', e.target.value)}
              placeholder="Alergi yang diketahui"
            />
          </div>

          {/* Immutable fields — read-only with tooltip */}
          <div className="space-y-1.5">
            <Tooltip content="Tanggal lahir tidak dapat diubah karena merupakan data identitas resmi">
              <label className="text-sm font-medium inline-flex items-center gap-1 cursor-help" style={{ color: 'var(--text-tertiary)' }}>
                Tanggal Lahir 🔒
              </label>
            </Tooltip>
            <Input
              value={patient.date_of_birth ? formatDate(patient.date_of_birth) : '-'}
              readOnly
              disabled
              aria-describedby="dob-readonly-hint"
              className="opacity-60 cursor-not-allowed"
            />
            <span id="dob-readonly-hint" className="sr-only">
              Field ini tidak dapat diubah karena merupakan data identitas resmi
            </span>
          </div>

          <div className="space-y-1.5">
            <Tooltip content="NIK tidak dapat diubah karena merupakan nomor identitas pemerintah">
              <label className="text-sm font-medium inline-flex items-center gap-1 cursor-help" style={{ color: 'var(--text-tertiary)' }}>
                NIK (No. Identitas) 🔒
              </label>
            </Tooltip>
            <Input
              value={patient.nik || '-'}
              readOnly
              disabled
              aria-describedby="nik-readonly-hint"
              className="opacity-60 cursor-not-allowed"
            />
            <span id="nik-readonly-hint" className="sr-only">
              Field ini tidak dapat diubah karena merupakan nomor identitas pemerintah
            </span>
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
            <Button type="submit" variant="primary" loading={updateMutation.isPending}>
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Patient Detail View ─────────────────────────────────────────────────────

interface PatientDetailViewProps {
  patient: Patient
  onBack: () => void
  onEdit: () => void
}

function PatientDetailView({ patient, onBack, onEdit }: PatientDetailViewProps) {
  const [activeTab, setActiveTab] = useState<DetailView>('profile')

  // Fetch appointment history
  const { data: appointmentsData } = useQuery({
    queryKey: ['patients', patient.id, 'appointments'],
    queryFn: () => apiClient.get<{ data: Appointment[] }>(`/appointments`, {
      params: { patient_id: patient.id },
    }),
    staleTime: queryConfig.appointments.staleTime,
    gcTime: queryConfig.appointments.gcTime,
  })

  // Fetch medical records
  const { data: recordsData } = useQuery({
    queryKey: [...queryKeys.medicalRecords.byPatient(patient.id)],
    queryFn: () => apiClient.get<{ data: MedicalRecord[] }>(`/medical-records`, {
      params: { patient_id: patient.id },
    }),
    staleTime: queryConfig.medicalRecords.staleTime,
    gcTime: queryConfig.medicalRecords.gcTime,
  })

  const appointments: Appointment[] = appointmentsData?.data?.data ?? []
  const records: MedicalRecord[] = recordsData?.data?.data ?? []
  const activeTicket = appointments.find(
    (a) => a.status === 'waiting' || a.status === 'in_progress'
  )

  const tabs: { key: DetailView; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: 'Profil', icon: <Users className="size-4" /> },
    { key: 'appointments', label: 'Riwayat Janji', icon: <Calendar className="size-4" /> },
    { key: 'records', label: 'Rekam Medis', icon: <FileText className="size-4" /> },
    { key: 'queue', label: 'Antrian Aktif', icon: <Clock className="size-4" /> },
  ]

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} leftIcon={<ArrowLeft className="size-4" />}>
          Kembali
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {patient.full_name ?? patient.user?.full_name}
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {patient.user?.email}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onEdit} leftIcon={<Pencil className="size-4" />}>
          Edit
        </Button>
      </div>

      {/* Tab navigation */}
      <div
        className="flex gap-1 p-1 rounded-[var(--radius-lg)]"
        style={{ backgroundColor: 'var(--surface-sunken, hsl(40 25% 95%))' }}
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[var(--radius-md)] transition-colors"
            style={{
              backgroundColor: activeTab === tab.key ? 'var(--surface-raised)' : 'transparent',
              color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-tertiary)',
              boxShadow: activeTab === tab.key ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        className="rounded-[var(--radius-lg)] p-6"
        style={{
          backgroundColor: 'var(--surface-raised)',
          border: '1px solid var(--border-default)',
        }}
        role="tabpanel"
      >
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Nama Lengkap', value: patient.full_name ?? patient.user?.full_name ?? '-' },
              { label: 'Email', value: patient.user?.email ?? '-' },
              { label: 'Telepon', value: patient.phone ?? patient.user?.phone ?? '-' },
              { label: 'NIK', value: patient.nik ?? '-' },
              { label: 'Tanggal Lahir', value: patient.date_of_birth ? formatDate(patient.date_of_birth) : '-' },
              { label: 'Jenis Kelamin', value: patient.gender === 'male' ? 'Laki-laki' : patient.gender === 'female' ? 'Perempuan' : '-' },
              { label: 'Golongan Darah', value: patient.blood_type ?? '-' },
              { label: 'Alergi', value: patient.allergies ?? '-' },
              { label: 'Alamat', value: patient.address ?? '-' },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="p-3 rounded-[var(--radius-md)]"
                style={{ backgroundColor: 'var(--surface-sunken)' }}
              >
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
                <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'appointments' && (
          <div>
            {appointments.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="Belum ada janji temu"
                description="Pasien ini belum memiliki riwayat janji temu."
              />
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
                {appointments.map((apt) => (
                  <div key={apt.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {apt.doctor?.full_name ?? 'Dokter'}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {formatDate(apt.appointment_date)} • Antrian #{apt.queue_number}
                      </p>
                    </div>
                    <Badge variant={
                      apt.status === 'completed' ? 'success' :
                      apt.status === 'cancelled' ? 'destructive' :
                      apt.status === 'in_progress' ? 'warning' : 'secondary'
                    }>
                      {apt.status === 'waiting' ? 'Menunggu' :
                       apt.status === 'in_progress' ? 'Konsultasi' :
                       apt.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'records' && (
          <div>
            {records.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Belum ada rekam medis"
                description="Pasien ini belum memiliki rekam medis."
              />
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
                {records.map((rec) => (
                  <div key={rec.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {rec.complaint}
                      </p>
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {formatDate(rec.created_at)}
                      </span>
                    </div>
                    {rec.diagnosis && (
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Diagnosis: {rec.diagnosis}
                      </p>
                    )}
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      Dr. {rec.doctor?.full_name ?? '-'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'queue' && (
          <div>
            {activeTicket ? (
              <div
                className="p-4 rounded-[var(--radius-lg)] text-center"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--category-queue) 8%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--category-queue) 20%, transparent)',
                }}
              >
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Nomor Antrian
                </p>
                <p
                  className="text-4xl font-bold font-mono"
                  style={{ color: 'var(--category-queue)' }}
                >
                  {activeTicket.queue_number}
                </p>
                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                  Dr. {activeTicket.doctor?.full_name ?? '-'}
                </p>
                <Badge variant={activeTicket.status === 'in_progress' ? 'warning' : 'secondary'} className="mt-2">
                  {activeTicket.status === 'waiting' ? 'Menunggu' : 'Dalam Konsultasi'}
                </Badge>
              </div>
            ) : (
              <EmptyState
                icon={Clock}
                title="Tidak ada antrian aktif"
                description="Pasien ini tidak memiliki tiket antrian aktif saat ini."
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── CSV Export Utility ───────────────────────────────────────────────────────

function exportPatientsCSV(patients: Patient[]) {
  const headers = ['Nama', 'Tanggal Lahir', 'Telepon', 'Email', 'NIK', 'Alamat', 'Golongan Darah']
  const rows = patients.map((p) => [
    p.full_name ?? p.user?.full_name ?? '',
    p.date_of_birth ?? '',
    p.phone ?? p.user?.phone ?? '',
    p.user?.email ?? '',
    p.nik ?? '',
    p.address ?? '',
    p.blood_type ?? '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `patients_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ── Main Page Component ─────────────────────────────────────────────────────

export default function AdminPatientsPage() {
  const queryClient = useQueryClient()

  // Search state with debounce (300ms)
  const { value: searchValue, debouncedValue: debouncedSearch, setValue: setSearchValue } = useDebouncedSearch()

  // Pagination — server-side, max 10 items per page (Requirement 24.6: ≤50 DOM nodes)
  const [page, setPage] = useState(1)
  const perPage = 10

  // View state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Patient | null>(null)

  // Fetch patients
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...queryKeys.patients.all, { page, per_page: perPage, search: debouncedSearch }],
    queryFn: () => patientApi.getAll({ page, per_page: perPage, search: debouncedSearch }),
    staleTime: queryConfig.patients.staleTime,
    gcTime: queryConfig.patients.gcTime,
  })

  const paginatedData = data?.data
  const patients: Patient[] = paginatedData?.data ?? []
  const meta = paginatedData?.meta
  const totalPages = meta?.total_pages ?? 1

  // Reset page when search changes
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value)
    setPage(1)
  }, [setSearchValue])

  // Handlers
  const handleRowClick = useCallback((patient: Patient) => {
    setSelectedPatient(patient)
  }, [])

  const handleEdit = useCallback((patient: Patient) => {
    setEditTarget(patient)
    setEditModalOpen(true)
  }, [])

  const handleEditSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.patients.all })
    // Refresh detail view if open
    if (selectedPatient && editTarget && selectedPatient.id === editTarget.id) {
      setSelectedPatient({ ...selectedPatient, ...editTarget })
    }
  }, [queryClient, selectedPatient, editTarget])

  const handleExportCSV = useCallback(() => {
    exportPatientsCSV(patients)
    toast.success('Data pasien berhasil diekspor')
  }, [patients])

  // Table columns
  const columns: Column<Patient>[] = useMemo(() => [
    {
      key: 'full_name',
      label: 'Nama',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--category-patient), var(--accent-primary))',
              color: 'var(--text-inverse)',
            }}
          >
            {(row.full_name ?? row.user?.full_name ?? 'P').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
              {row.full_name ?? row.user?.full_name}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {row.user?.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'date_of_birth',
      label: 'Tanggal Lahir',
      render: (row) => (
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {row.date_of_birth ? formatDate(row.date_of_birth) : '-'}
        </span>
      ),
    },
    {
      key: 'phone',
      label: 'Telepon',
      render: (row) => (
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {row.phone ?? row.user?.phone ?? '-'}
        </span>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (row) => (
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {row.user?.email ?? '-'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Tgl. Registrasi',
      render: (row) => (
        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          {(row as unknown as { created_at?: string }).created_at
            ? formatDate((row as unknown as { created_at?: string }).created_at!)
            : '-'}
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
            aria-label={`Edit ${row.full_name ?? row.user?.full_name}`}
            title="Edit"
          >
            <Pencil className="size-4" style={{ color: 'var(--accent-primary)' }} />
          </button>
        </div>
      ),
    },
  ], [handleEdit])

  // If a patient is selected, show detail view
  if (selectedPatient) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Data Pasien"
          subtitle="Detail informasi pasien"
          category="admin"
        />
        <PatientDetailView
          patient={selectedPatient}
          onBack={() => setSelectedPatient(null)}
          onEdit={() => handleEdit(selectedPatient)}
        />
        {editTarget && (
          <PatientEditModal
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            patient={editTarget}
            onSuccess={handleEditSuccess}
          />
        )}
      </div>
    )
  }

  // Error state for fetch failure
  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Data Pasien"
          subtitle="Kelola data dan profil pasien"
          category="admin"
        />
        <ErrorState
          title="Gagal Memuat Data"
          message="Tidak dapat memuat daftar pasien. Periksa koneksi internet Anda dan coba lagi."
          category="network"
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Pasien"
        subtitle="Kelola data dan profil pasien"
        category="admin"
        actions={
          <Button
            variant="outline"
            onClick={handleExportCSV}
            leftIcon={<Download className="size-4" />}
            disabled={patients.length === 0}
          >
            Ekspor CSV
          </Button>
        }
      />

      {/* Data Table */}
      <DataTable<Patient>
        columns={columns}
        data={patients}
        loading={isLoading}
        pagination={{
          page,
          totalPages,
          onPageChange: setPage,
        }}
        onRowClick={handleRowClick}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Cari nama, telepon, atau email..."
        emptyState={
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="size-12 mb-4 opacity-20" style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Tidak ada pasien ditemukan
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              {debouncedSearch
                ? 'Coba ubah kata kunci pencarian.'
                : 'Belum ada pasien terdaftar.'}
            </p>
          </div>
        }
      />

      {/* Edit Modal */}
      {editTarget && (
        <PatientEditModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          patient={editTarget}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}
