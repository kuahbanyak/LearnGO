import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FileText,
  Plus,
  Download,
  ArrowLeft,
  Calendar,
  Loader2,
  Trash2,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { medicalRecordApi } from '@/api/appointments'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DataTable, type Column } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { useDebouncedSearch } from '@/hooks/use-debounced-search'
import { useAuthStore } from '@/store/auth-store'
import { queryKeys, queryConfig } from '@/lib/query-keys'
import { medicalRecordSchema, type MedicalRecordFormData } from '@/lib/validations/schemas'
import { toast } from '@/hooks/use-toast'
import type { MedicalRecord, Appointment } from '@/types'

// ── Helpers ──

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getDefaultDateRange(): { start: string; end: string } {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

/** Download a medical record as PDF via the backend export endpoint */
async function downloadRecordPDF(recordId: string) {
  const token = localStorage.getItem('mediqueue-auth')
  const authToken = token ? JSON.parse(token).state?.token : ''
  // Also check sessionStorage
  const sessionToken = sessionStorage.getItem('mediqueue-auth')
  const finalToken = authToken || (sessionToken ? JSON.parse(sessionToken).state?.token : '')

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'
  const response = await fetch(`${baseUrl}/medical-records/${recordId}/pdf`, {
    headers: { Authorization: `Bearer ${finalToken}` },
  })

  if (!response.ok) throw new Error('Export failed')

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `rekam_medis_${new Date().toISOString().split('T')[0]}.pdf`
  document.body.appendChild(a)
  a.click()
  URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

// ── Types ──

type ViewMode = 'list' | 'detail' | 'create'

interface PrescriptionInput {
  medicine_name: string
  dosage: string
  quantity: number
  usage_instruction: string
}

// ── Detail View Component ──

function RecordDetailView({
  record,
  onBack,
}: {
  record: MedicalRecord
  onBack: () => void
}) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      await downloadRecordPDF(record.id)
      toast.success('PDF berhasil diunduh')
    } catch {
      toast.error('Gagal mengunduh PDF')
    } finally {
      setExporting(false)
    }
  }

  const fields = [
    { label: 'Keluhan Utama', value: record.complaint },
    { label: 'Riwayat', value: record.doctor_notes },
    { label: 'Pemeriksaan', value: record.action_taken },
    { label: 'Diagnosa', value: record.diagnosis },
    { label: 'Kode ICD-10', value: record.icd_code },
    { label: 'Rencana Tindakan', value: record.action_taken },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} aria-label="Kembali ke daftar">
          <ArrowLeft className="size-4 mr-1" /> Kembali
        </Button>
      </div>

      <PageHeader
        title="Detail Rekam Medis"
        subtitle={`${record.patient?.user?.full_name ?? 'Pasien'} — ${formatDate(record.created_at)}`}
        category="doctor"
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
            aria-label="Unduh PDF rekam medis"
          >
            {exporting ? <Loader2 className="size-4 animate-spin mr-1" /> : <Download className="size-4 mr-1" />}
            Unduh PDF
          </Button>
        }
      />

      <Card surface="raised">
        <CardContent className="p-6 space-y-5">
          {fields.filter(f => f.value).map(({ label, value }) => (
            <div key={label}>
              <p
                className="text-body-sm font-semibold mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                {label}
              </p>
              <p className="text-body-md" style={{ color: 'var(--text-primary)' }}>
                {value}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Prescriptions */}
      {record.prescriptions && record.prescriptions.length > 0 && (
        <Card surface="raised">
          <CardHeader>
            <CardTitle className="text-base">Resep Obat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {record.prescriptions.map((p, i) => (
              <div
                key={i}
                className="p-3 rounded-[var(--radius-md)]"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  {p.medicine_name}
                </p>
                <div className="flex gap-4 mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {p.dosage && <span>Dosis: {p.dosage}</span>}
                  {p.quantity && <span>Jumlah: {p.quantity}</span>}
                  {p.usage_instruction && <span>Aturan: {p.usage_instruction}</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Follow-up notes */}
      {record.doctor_notes && (
        <Card surface="raised">
          <CardHeader>
            <CardTitle className="text-base">Catatan Tindak Lanjut</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-body-md" style={{ color: 'var(--text-primary)' }}>
              {record.doctor_notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── Creation Form Component ──

function RecordCreateForm({
  appointment,
  onBack,
  onSuccess,
}: {
  appointment?: Appointment | null
  onBack: () => void
  onSuccess: () => void
}) {
  const queryClient = useQueryClient()
  const [prescriptions, setPrescriptions] = useState<PrescriptionInput[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MedicalRecordFormData>({
    resolver: zodResolver(medicalRecordSchema),
    defaultValues: {
      chiefComplaint: '',
      diagnosis: '',
      treatmentPlan: '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: MedicalRecordFormData) =>
      medicalRecordApi.create({
        appointment_id: appointment?.id ?? '',
        complaint: data.chiefComplaint,
        diagnosis: data.diagnosis,
        action_taken: data.treatmentPlan,
        prescriptions: prescriptions.filter(p => p.medicine_name.trim()),
      }),
    onSuccess: () => {
      toast.success('Rekam medis berhasil disimpan')
      queryClient.invalidateQueries({ queryKey: queryKeys.medicalRecords.all })
      onSuccess()
    },
    onError: () => {
      toast.error('Gagal menyimpan rekam medis')
    },
  })

  const addPrescription = () => {
    setPrescriptions([...prescriptions, { medicine_name: '', dosage: '', quantity: 1, usage_instruction: '' }])
  }

  const removePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index))
  }

  const onSubmit = (data: MedicalRecordFormData) => {
    mutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} aria-label="Kembali ke daftar">
          <ArrowLeft className="size-4 mr-1" /> Kembali
        </Button>
      </div>

      <PageHeader
        title="Buat Rekam Medis"
        subtitle={
          appointment
            ? `Pasien: ${appointment.patient?.user?.full_name ?? 'Pasien'} — Antrian #${appointment.queue_number}`
            : 'Buat rekam medis baru'
        }
        category="doctor"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Main fields */}
        <Card surface="raised">
          <CardHeader>
            <CardTitle className="text-base">Informasi Pemeriksaan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Chief Complaint */}
            <div className="space-y-1.5">
              <label
                htmlFor="chiefComplaint"
                className="text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Keluhan Utama *
              </label>
              <textarea
                id="chiefComplaint"
                {...register('chiefComplaint')}
                className="flex min-h-[100px] w-full rounded-[var(--radius-md)] border px-3 py-2 text-sm resize-none transition-colors focus:outline-none focus:ring-2"
                style={{
                  borderColor: errors.chiefComplaint ? 'var(--accent-danger)' : 'var(--border-default)',
                  backgroundColor: 'var(--surface-sunken)',
                }}
                maxLength={5000}
                aria-describedby={errors.chiefComplaint ? 'chiefComplaint-error' : undefined}
              />
              {errors.chiefComplaint && (
                <p id="chiefComplaint-error" className="text-xs" style={{ color: 'var(--accent-danger)' }}>
                  {errors.chiefComplaint.message}
                </p>
              )}
            </div>

            {/* Diagnosis */}
            <div className="space-y-1.5">
              <label
                htmlFor="diagnosis"
                className="text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Diagnosa *
              </label>
              <textarea
                id="diagnosis"
                {...register('diagnosis')}
                className="flex min-h-[80px] w-full rounded-[var(--radius-md)] border px-3 py-2 text-sm resize-none transition-colors focus:outline-none focus:ring-2"
                style={{
                  borderColor: errors.diagnosis ? 'var(--accent-danger)' : 'var(--border-default)',
                  backgroundColor: 'var(--surface-sunken)',
                }}
                maxLength={5000}
                aria-describedby={errors.diagnosis ? 'diagnosis-error' : undefined}
              />
              {errors.diagnosis && (
                <p id="diagnosis-error" className="text-xs" style={{ color: 'var(--accent-danger)' }}>
                  {errors.diagnosis.message}
                </p>
              )}
            </div>

            {/* Treatment Plan */}
            <div className="space-y-1.5">
              <label
                htmlFor="treatmentPlan"
                className="text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Rencana Tindakan *
              </label>
              <textarea
                id="treatmentPlan"
                {...register('treatmentPlan')}
                className="flex min-h-[80px] w-full rounded-[var(--radius-md)] border px-3 py-2 text-sm resize-none transition-colors focus:outline-none focus:ring-2"
                style={{
                  borderColor: errors.treatmentPlan ? 'var(--accent-danger)' : 'var(--border-default)',
                  backgroundColor: 'var(--surface-sunken)',
                }}
                maxLength={5000}
                aria-describedby={errors.treatmentPlan ? 'treatmentPlan-error' : undefined}
              />
              {errors.treatmentPlan && (
                <p id="treatmentPlan-error" className="text-xs" style={{ color: 'var(--accent-danger)' }}>
                  {errors.treatmentPlan.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Prescriptions */}
        <Card surface="raised">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Resep Obat</CardTitle>
            <Button type="button" variant="secondary" size="sm" onClick={addPrescription}>
              <Plus className="size-3 mr-1" /> Tambah Obat
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {prescriptions.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-tertiary)' }}>
                Belum ada resep obat ditambahkan
              </p>
            )}
            {prescriptions.map((p, i) => (
              <div
                key={i}
                className="p-4 rounded-[var(--radius-md)] space-y-3"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Obat #{i + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePrescription(i)}
                    aria-label={`Hapus obat ${i + 1}`}
                  >
                    <Trash2 className="size-3.5" style={{ color: 'var(--accent-danger)' }} />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Nama Obat *
                    </label>
                    <Input
                      value={p.medicine_name}
                      onChange={(e) => {
                        const updated = [...prescriptions]
                        updated[i].medicine_name = e.target.value
                        setPrescriptions(updated)
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Dosis
                    </label>
                    <Input
                      placeholder="cth: 3x1"
                      value={p.dosage}
                      onChange={(e) => {
                        const updated = [...prescriptions]
                        updated[i].dosage = e.target.value
                        setPrescriptions(updated)
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Jumlah
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={p.quantity}
                      onChange={(e) => {
                        const updated = [...prescriptions]
                        updated[i].quantity = parseInt(e.target.value) || 1
                        setPrescriptions(updated)
                      }}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Aturan Pakai
                    </label>
                    <Input
                      placeholder="cth: Sesudah makan"
                      value={p.usage_instruction}
                      onChange={(e) => {
                        const updated = [...prescriptions]
                        updated[i].usage_instruction = e.target.value
                        setPrescriptions(updated)
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onBack}>
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <><Loader2 className="size-4 animate-spin mr-1" /> Menyimpan...</>
            ) : (
              'Simpan Rekam Medis'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

// ── Main Page Component ──

export default function DoctorMedicalRecordsPage() {
  const { user } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null)
  const [linkedAppointment, setLinkedAppointment] = useState<Appointment | null>(null)

  // Search with debounce (300ms)
  const { value: searchValue, debouncedValue: debouncedSearch, setValue: setSearchValue } = useDebouncedSearch('')

  // Pagination — server-side, backend defaults to 10 items/page (Requirement 24.6: ≤50 DOM nodes)
  const [page, setPage] = useState(1)

  // Date range filter (default: last 30 days)
  const defaultRange = getDefaultDateRange()
  const [dateFrom, setDateFrom] = useState(searchParams.get('from') || defaultRange.start)
  const [dateTo, setDateTo] = useState(searchParams.get('to') || defaultRange.end)

  // Fetch medical records for the signed-in doctor
  const doctorId = user?.doctor?.id ?? ''

  const {
    data: recordsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [...queryKeys.medicalRecords.all, 'doctor-list', debouncedSearch, page, dateFrom, dateTo],
    queryFn: () =>
      medicalRecordApi.getByPatient(doctorId, { page }),
    staleTime: queryConfig.medicalRecords.staleTime,
    gcTime: queryConfig.medicalRecords.gcTime,
    enabled: !!doctorId,
  })

  const records: MedicalRecord[] = recordsData?.data?.data ?? []
  const meta = recordsData?.data?.meta

  // Filter records by search term and date range (client-side filtering)
  const filteredRecords = records.filter((record) => {
    // Search filter: patient name or diagnosis
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase()
      const patientName = (record.patient?.user?.full_name ?? '').toLowerCase()
      const diagnosis = (record.diagnosis ?? '').toLowerCase()
      if (!patientName.includes(searchLower) && !diagnosis.includes(searchLower)) {
        return false
      }
    }
    // Date range filter
    if (record.created_at) {
      const recordDate = record.created_at.split('T')[0]
      if (dateFrom && recordDate < dateFrom) return false
      if (dateTo && recordDate > dateTo) return false
    }
    return true
  })

  // Handle row click → detail view
  const handleRowClick = useCallback((record: MedicalRecord) => {
    setSelectedRecord(record)
    setViewMode('detail')
  }, [])

  // Handle create action
  const handleCreate = useCallback((appointment?: Appointment | null) => {
    setLinkedAppointment(appointment ?? null)
    setViewMode('create')
  }, [])

  // Handle back to list
  const handleBackToList = useCallback(() => {
    setViewMode('list')
    setSelectedRecord(null)
    setLinkedAppointment(null)
  }, [])

  // Handle date range change
  const handleDateFromChange = (value: string) => {
    setDateFrom(value)
    setPage(1)
    setSearchParams((prev) => {
      prev.set('from', value)
      return prev
    })
  }

  const handleDateToChange = (value: string) => {
    setDateTo(value)
    setPage(1)
    setSearchParams((prev) => {
      prev.set('to', value)
      return prev
    })
  }

  // Handle search change resets pagination
  const handleSearchChange = (val: string) => {
    setSearchValue(val)
    setPage(1)
  }

  // ── Render based on view mode ──

  if (viewMode === 'detail' && selectedRecord) {
    return <RecordDetailView record={selectedRecord} onBack={handleBackToList} />
  }

  if (viewMode === 'create') {
    return (
      <RecordCreateForm
        appointment={linkedAppointment}
        onBack={handleBackToList}
        onSuccess={handleBackToList}
      />
    )
  }

  // ── List View ──

  // DataTable columns
  const columns: Column<MedicalRecord>[] = [
    {
      key: 'patient_name',
      label: 'Pasien',
      render: (row) => (
        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
          {row.patient?.user?.full_name ?? '—'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Tanggal Kunjungan',
      sortable: true,
      render: (row) => formatDate(row.created_at),
    },
    {
      key: 'complaint',
      label: 'Keluhan Utama',
      render: (row) => (
        <span className="truncate max-w-[200px] inline-block">
          {row.complaint || '—'}
        </span>
      ),
    },
    {
      key: 'diagnosis',
      label: 'Diagnosa',
      render: (row) => (
        <span className="truncate max-w-[200px] inline-block">
          {row.diagnosis || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '80px',
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            handleExportSingle(row.id)
          }}
          aria-label="Unduh PDF"
        >
          <Download className="size-4" />
        </Button>
      ),
    },
  ]

  // PDF export for a single record from the list
  const handleExportSingle = async (recordId: string) => {
    try {
      await downloadRecordPDF(recordId)
      toast.success('PDF berhasil diunduh')
    } catch {
      toast.error('Gagal mengunduh PDF')
    }
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Rekam Medis" category="doctor" />
        <ErrorState
          message="Gagal memuat data rekam medis"
          category="server"
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekam Medis"
        subtitle="Kelola dan lihat riwayat rekam medis pasien Anda"
        category="doctor"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleCreate()}
            aria-label="Buat rekam medis baru"
          >
            <Plus className="size-4 mr-1" /> Buat Rekam Medis
          </Button>
        }
      />

      {/* Date range filter */}
      <div
        className="flex flex-wrap items-center gap-3"
        role="group"
        aria-label="Filter tanggal"
      >
        <div className="flex items-center gap-2">
          <Calendar className="size-4" style={{ color: 'var(--text-tertiary)' }} />
          <label htmlFor="date-from" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Dari:
          </label>
          <input
            id="date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => handleDateFromChange(e.target.value)}
            className="px-3 py-1.5 rounded-[var(--radius-md)] text-sm transition-colors"
            style={{
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--surface-sunken)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="date-to" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Sampai:
          </label>
          <input
            id="date-to"
            type="date"
            value={dateTo}
            onChange={(e) => handleDateToChange(e.target.value)}
            className="px-3 py-1.5 rounded-[var(--radius-md)] text-sm transition-colors"
            style={{
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--surface-sunken)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      {/* DataTable with search and pagination */}
      <DataTable<MedicalRecord>
        columns={columns}
        data={filteredRecords}
        loading={isLoading}
        pagination={
          meta
            ? {
                page: meta.page,
                totalPages: meta.total_pages,
                onPageChange: setPage,
              }
            : undefined
        }
        onRowClick={handleRowClick}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Cari pasien atau diagnosa..."
        emptyState={
          <EmptyState
            icon={FileText}
            title="Belum ada rekam medis"
            description="Rekam medis akan muncul setelah Anda menyelesaikan konsultasi pasien."
            action={{
              label: 'Buat Rekam Medis',
              onClick: () => handleCreate(),
            }}
          />
        }
      />
    </div>
  )
}
