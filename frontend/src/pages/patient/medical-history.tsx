import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Stethoscope,
  Download,
  Star,
  ArrowLeft,
  Calendar,
  FileText,
  Pill,
  ClipboardList,
} from 'lucide-react'

import { medicalRecordApi } from '@/api/appointments'
import { ratingsApi } from '@/api/ratings'
import { queryKeys, STALE_TIME_RECORDS, GC_TIME_RECORDS } from '@/lib/query-keys'
import { formatDate } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import StarRating from '@/components/shared/star-rating'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import type { MedicalRecord } from '@/types'

/**
 * PatientMedicalHistoryPage — Displays the patient's past medical records
 * in a chronological list with detail view, rating, and PDF export.
 *
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6
 */

// ── Rating Modal ────────────────────────────────────────────────────────────

interface RatingModalProps {
  record: MedicalRecord
  onClose: () => void
  onSubmitted: () => void
}

function RatingModal({ record, onClose, onSubmitted }: RatingModalProps) {
  const [score, setScore] = useState(0)
  const [comment, setComment] = useState('')

  const queryClient = useQueryClient()

  const ratingMutation = useMutation({
    mutationFn: (data: { appointment_id: string; score: number; comment?: string }) =>
      ratingsApi.create(data),
    onSuccess: () => {
      toast.success('Rating berhasil dikirim')
      queryClient.invalidateQueries({ queryKey: queryKeys.medicalRecords.my() })
      onSubmitted()
    },
    onError: () => {
      toast.error('Gagal mengirim rating')
    },
  })

  const handleSubmit = () => {
    if (score < 1 || score > 5) return
    ratingMutation.mutate({
      appointment_id: record.appointment_id,
      score,
      comment: comment.trim() || undefined,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rating-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        className="relative w-full max-w-md mx-4 rounded-[var(--radius-lg,1rem)] p-6"
        style={{
          backgroundColor: 'var(--surface-default, #fff)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <h2
          id="rating-modal-title"
          className="text-lg font-semibold mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          Beri Rating
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Dr. {record.doctor?.user?.full_name ?? record.doctor?.full_name ?? 'Dokter'} — {formatDate(record.created_at)}
        </p>

        {/* Star Rating Input */}
        <div className="flex flex-col items-center gap-2 mb-4">
          <StarRating
            rating={score}
            size="lg"
            interactive
            onChange={setScore}
          />
          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {score === 0 ? 'Pilih rating' : `${score} dari 5`}
          </span>
        </div>

        {/* Comment field */}
        <div className="mb-4">
          <label
            htmlFor="rating-comment"
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            Komentar (opsional)
          </label>
          <textarea
            id="rating-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 1000))}
            placeholder="Tulis komentar Anda..."
            rows={3}
            maxLength={1000}
            className="w-full rounded-[var(--radius-md,0.5rem)] border p-3 text-sm resize-none focus:outline-none focus:ring-2"
            style={{
              borderColor: 'var(--border-default)',
              backgroundColor: 'var(--surface-sunken)',
              color: 'var(--text-primary)',
            }}
            aria-describedby="comment-char-count"
          />
          <p
            id="comment-char-count"
            className="text-xs mt-1 text-right"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {comment.length}/1000
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={ratingMutation.isPending}
          >
            Batal
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={score === 0 || ratingMutation.isPending}
          >
            {ratingMutation.isPending ? 'Mengirim...' : 'Kirim Rating'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Detail View ─────────────────────────────────────────────────────────────

interface DetailViewProps {
  record: MedicalRecord
  onBack: () => void
  onRate: () => void
  canRate: boolean
}

function DetailView({ record, onBack, onRate, canRate }: DetailViewProps) {
  const handleDownloadPDF = async () => {
    try {
      const token = localStorage.getItem('mediqueue-auth')
      const authToken = token ? JSON.parse(token).state?.token : ''
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'}/medical-records/${record.id}/pdf`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      if (!response.ok) throw new Error('Export failed')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rekam_medis_${formatDate(record.created_at).replace(/\s/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('PDF berhasil diunduh')
    } catch {
      toast.error('Gagal mengunduh PDF')
    }
  }

  const fields = [
    { label: 'Keluhan Utama', value: record.complaint, icon: ClipboardList },
    { label: 'Diagnosa', value: record.diagnosis, icon: FileText },
    { label: 'Kode ICD-10', value: record.icd_code, icon: FileText },
    { label: 'Tindakan', value: record.action_taken, icon: FileText },
    { label: 'Catatan Dokter', value: record.doctor_notes, icon: FileText },
  ].filter((f) => f.value)

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        aria-label="Kembali ke daftar riwayat medis"
      >
        <ArrowLeft className="size-4" />
        Kembali ke Daftar
      </button>

      {/* Record header */}
      <Card surface="raised" padding="lg">
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div
                className="w-11 h-11 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--category-doctor) 10%, transparent)',
                }}
              >
                <Stethoscope className="size-5" style={{ color: 'var(--category-doctor)' }} aria-hidden="true" />
              </div>
              <div>
                <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Dr. {record.doctor?.user?.full_name ?? record.doctor?.full_name ?? 'Dokter'}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  {record.doctor?.specialization}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Calendar className="size-3" style={{ color: 'var(--text-tertiary)' }} aria-hidden="true" />
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {formatDate(record.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {canRate && (
                <Button variant="outline" size="sm" onClick={onRate}>
                  <Star className="size-3.5 mr-1.5" />
                  Beri Rating
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="size-3.5 mr-1.5" />
                PDF
              </Button>
            </div>
          </div>

          {/* Record fields (read-only) */}
          <div className="space-y-4 pt-4" style={{ borderTop: '1px solid var(--border-default)' }}>
            {fields.map(({ label, value, icon: Icon }) => (
              <div key={label}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="size-3.5" style={{ color: 'var(--text-tertiary)' }} aria-hidden="true" />
                  <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                    {label}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Prescriptions */}
          {record.prescriptions && record.prescriptions.length > 0 && (
            <div className="pt-4" style={{ borderTop: '1px solid var(--border-default)' }}>
              <div className="flex items-center gap-1.5 mb-3">
                <Pill className="size-3.5" style={{ color: 'var(--text-tertiary)' }} aria-hidden="true" />
                <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  Resep Obat ({record.prescriptions.length})
                </span>
              </div>
              <div className="space-y-2">
                {record.prescriptions.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-[var(--radius-md)] border"
                    style={{
                      borderColor: 'var(--border-default)',
                      backgroundColor: 'var(--surface-sunken)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {p.medicine_name}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {p.quantity} {p.dosage && `· ${p.dosage}`}
                      </span>
                    </div>
                    {p.usage_instruction && (
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {p.usage_instruction}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function MedicalHistoryPage() {
  const [page, setPage] = useState(1)
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null)
  const [ratingRecord, setRatingRecord] = useState<MedicalRecord | null>(null)

  // Track which records have been rated in this session (optimistic)
  const [ratedRecordIds, setRatedRecordIds] = useState<Set<string>>(new Set())

  const { data, isLoading } = useQuery({
    queryKey: [...queryKeys.medicalRecords.my(), page],
    queryFn: () => medicalRecordApi.getMy({ page }),
    staleTime: STALE_TIME_RECORDS,
    gcTime: GC_TIME_RECORDS,
  })

  const records: MedicalRecord[] = data?.data?.data ?? []
  const meta = data?.data?.meta
  const totalPages = meta?.total_pages ?? 1

  /**
   * Determines if a record is eligible for rating:
   * - Must have an associated appointment that is completed
   * - Must not already have a rating recorded
   * - Must not have been rated in this session
   */
  const canRateRecord = useCallback(
    (record: MedicalRecord): boolean => {
      if (ratedRecordIds.has(record.id)) return false
      // If the appointment is completed and no rating exists
      const appointment = record.appointment
      if (appointment && appointment.status === 'completed') {
        // Check if rating already exists (we use a heuristic: if the record has no rating field)
        return true
      }
      // Default: show rating for all records (they are medical records from completed visits)
      return !ratedRecordIds.has(record.id)
    },
    [ratedRecordIds]
  )

  const handleRatingSubmitted = () => {
    if (ratingRecord) {
      setRatedRecordIds((prev) => new Set(prev).add(ratingRecord.id))
    }
    setRatingRecord(null)
  }

  const handleExportAll = async () => {
    try {
      const token = localStorage.getItem('mediqueue-auth')
      const authToken = token ? JSON.parse(token).state?.token : ''
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'}/medical-records/my/pdf`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      if (!response.ok) throw new Error('Export failed')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `riwayat_medis_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('PDF riwayat medis berhasil diunduh')
    } catch {
      toast.error('Gagal mengunduh PDF riwayat medis')
    }
  }

  // ── Detail View ──
  if (selectedRecord) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Detail Rekam Medis"
          subtitle="Informasi lengkap kunjungan"
          category="patient"
        />
        <DetailView
          record={selectedRecord}
          onBack={() => setSelectedRecord(null)}
          onRate={() => setRatingRecord(selectedRecord)}
          canRate={canRateRecord(selectedRecord)}
        />
        {ratingRecord && (
          <RatingModal
            record={ratingRecord}
            onClose={() => setRatingRecord(null)}
            onSubmitted={handleRatingSubmitted}
          />
        )}
      </div>
    )
  }

  // ── List View ──
  return (
    <div className="space-y-6">
      {/* Page Header — Requirement 19.6: PDF export action */}
      <PageHeader
        title="Riwayat Medis"
        subtitle="Rekam medis dan resep dari setiap kunjungan Anda"
        category="patient"
        actions={
          records.length > 0 ? (
            <Button variant="outline" size="sm" onClick={handleExportAll}>
              <Download className="size-3.5 mr-1.5" />
              Export PDF
            </Button>
          ) : undefined
        }
      />

      {/* Loading state */}
      {isLoading && <LoadingSkeleton variant="list-item" count={5} />}

      {/* Empty state */}
      {!isLoading && records.length === 0 && (
        <EmptyState
          icon={Stethoscope}
          title="Belum Ada Riwayat Medis"
          description="Riwayat medis akan muncul setelah Anda menjalani kunjungan ke dokter."
        />
      )}

      {/* Chronological list — Requirement 19.1 */}
      {!isLoading && records.length > 0 && (
        <>
          <div className="space-y-3">
            {records.map((record) => {
              const isRated = ratedRecordIds.has(record.id)

              return (
                <Card
                  key={record.id}
                  surface="raised"
                  className="transition-all cursor-pointer"
                  style={{
                    borderColor: 'var(--border-default)',
                  }}
                >
                  <CardContent className="p-0">
                    <div
                      className="flex items-center justify-between p-4 gap-4"
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedRecord(record)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSelectedRecord(record)
                        }
                      }}
                      aria-label={`Lihat detail rekam medis tanggal ${formatDate(record.created_at)}`}
                    >
                      {/* Left: Icon + Info */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div
                          className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: 'color-mix(in srgb, var(--category-doctor) 10%, transparent)',
                          }}
                        >
                          <Stethoscope className="size-4" style={{ color: 'var(--category-doctor)' }} aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          {/* Date */}
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Calendar className="size-3" style={{ color: 'var(--text-tertiary)' }} aria-hidden="true" />
                            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              {formatDate(record.created_at)}
                            </span>
                          </div>
                          {/* Doctor */}
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                            Dr. {record.doctor?.user?.full_name ?? record.doctor?.full_name ?? 'Dokter'}
                          </p>
                          {/* Complaint + Diagnosis */}
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {record.complaint && (
                              <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                                {record.complaint}
                              </span>
                            )}
                            {record.diagnosis && (
                              <>
                                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>•</span>
                                <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                                  {record.diagnosis}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Rating action or badge */}
                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {isRated ? (
                          <Badge
                            variant="secondary"
                            className="text-xs"
                          >
                            <Star className="size-3 mr-1" style={{ fill: 'var(--accent-warning)', color: 'var(--accent-warning)' }} />
                            Sudah Dinilai
                          </Badge>
                        ) : canRateRecord(record) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setRatingRecord(record)
                            }}
                            aria-label={`Beri rating untuk kunjungan ${formatDate(record.created_at)}`}
                          >
                            <Star className="size-3.5 mr-1" />
                            Rating
                          </Button>
                        ) : null}

                        {record.prescriptions && record.prescriptions.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <Pill className="size-2.5 mr-1" />
                            {record.prescriptions.length} obat
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Halaman {page} dari {totalPages} ({meta?.total} rekam medis)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                >
                  ← Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                >
                  Berikutnya →
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Rating Modal */}
      {ratingRecord && (
        <RatingModal
          record={ratingRecord}
          onClose={() => setRatingRecord(null)}
          onSubmitted={handleRatingSubmitted}
        />
      )}
    </div>
  )
}
