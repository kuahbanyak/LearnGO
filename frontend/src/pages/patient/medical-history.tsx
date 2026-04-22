import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Stethoscope, Loader2, ChevronDown, ChevronUp, Pill } from 'lucide-react'
import { medicalRecordApi } from '@/api/appointments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import type { MedicalRecord } from '@/types'

function MedicalRecordCard({ record }: { record: MedicalRecord }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-start justify-between gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
            <Stethoscope className="size-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold">Dr. {record.doctor?.user?.full_name}</p>
            <p className="text-xs text-muted-foreground">{record.doctor?.specialization}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{formatDate(record.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {record.prescriptions && record.prescriptions.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              <Pill className="size-2.5 mr-1" />
              {record.prescriptions.length} obat
            </Badge>
          )}
          {expanded ? <ChevronUp className="size-4 text-slate-400" /> : <ChevronDown className="size-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t bg-slate-50/50">
          <div className="pt-3 space-y-2.5">
            {[
              { label: 'Keluhan', value: record.complaint },
              { label: 'Diagnosa', value: record.diagnosis },
              { label: 'Kode ICD-10', value: record.icd_code },
              { label: 'Tindakan', value: record.action_taken },
              { label: 'Catatan Dokter', value: record.doctor_notes },
            ].filter(f => f.value).map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="text-sm mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {record.prescriptions && record.prescriptions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Resep Obat</p>
              <div className="space-y-1.5">
                {record.prescriptions.map((p, idx) => (
                  <div key={idx} className="p-2.5 bg-white rounded-lg border text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{p.medicine_name}</span>
                      <span className="text-muted-foreground">{p.quantity} {p.dosage && `· ${p.dosage}`}</span>
                    </div>
                    {p.usage_instruction && (
                      <p className="text-muted-foreground mt-0.5">{p.usage_instruction}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function MedicalHistoryPage() {
  const [page, setPage] = useState(1)

  // Gunakan endpoint /medical-records/my — patient akses rekam medisnya sendiri via JWT
  const { data, isLoading } = useQuery({
    queryKey: ['my-medical-records', page],
    queryFn: () => medicalRecordApi.getMy({ page }),
  })

  const records = data?.data?.data ?? []
  const meta = data?.data?.meta
  const totalPages = meta?.total_pages ?? 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Riwayat Medis</h1>
        <p className="text-slate-500 mt-1">Rekam medis dan resep dari setiap kunjungan Anda</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Stethoscope className="size-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">Belum ada riwayat medis</p>
            <p className="text-xs mt-1">Riwayat akan muncul setelah Anda menjalani kunjungan</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Stethoscope className="size-4" />
                {meta?.total} riwayat kunjungan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {records.map(record => (
                <MedicalRecordCard key={record.id} record={record} />
              ))}
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Halaman {page} dari {totalPages}</p>
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
        </div>
      )}
    </div>
  )
}
