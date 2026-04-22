import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Loader2, ChevronDown, ChevronUp, Pill, Search } from 'lucide-react'
import { patientApi } from '@/api/dashboard'
import { medicalRecordApi } from '@/api/appointments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'
import type { MedicalRecord, Patient } from '@/types'

function RecordCard({ record }: { record: MedicalRecord }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border rounded-xl overflow-hidden mb-2">
      <button
        className="w-full flex items-start justify-between gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <p className="text-sm font-semibold">{record.patient?.user?.full_name ?? '—'}</p>
          <p className="text-xs text-muted-foreground">{formatDate(record.created_at)}</p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{record.complaint}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {record.prescriptions && record.prescriptions.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Pill className="size-3" />{record.prescriptions.length}
            </span>
          )}
          {expanded ? <ChevronUp className="size-4 text-slate-400" /> : <ChevronDown className="size-4 text-slate-400" />}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t bg-slate-50/50 space-y-2.5 pt-3">
          {[
            { label: 'Diagnosa', value: record.diagnosis },
            { label: 'Kode ICD-10', value: record.icd_code },
            { label: 'Tindakan', value: record.action_taken },
            { label: 'Catatan Dokter', value: record.doctor_notes },
          ].filter(f => f.value).map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <p className="text-sm">{value}</p>
            </div>
          ))}
          {record.prescriptions && record.prescriptions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Resep Obat</p>
              {record.prescriptions.map((p, i) => (
                <div key={i} className="text-xs bg-white border rounded p-2 mb-1">
                  <span className="font-medium">{p.medicine_name}</span>
                  {p.dosage && <span className="text-muted-foreground"> · {p.dosage}</span>}
                  {p.quantity && <span className="text-muted-foreground"> · {p.quantity} biji</span>}
                  {p.usage_instruction && <p className="text-muted-foreground">{p.usage_instruction}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PatientRecords({ patient }: { patient: Patient }) {
  const [expanded, setExpanded] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['dr-patient-records', patient.id],
    queryFn: () => medicalRecordApi.getByPatient(patient.id),
    enabled: expanded,
  })

  const records: MedicalRecord[] = data?.data?.data ?? []

  return (
    <div className="border rounded-xl overflow-hidden mb-3">
      <button
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
            {patient.user?.full_name?.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium">{patient.user?.full_name}</p>
            <p className="text-xs text-muted-foreground">{patient.nik || patient.user?.email}</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="size-4 text-slate-400" /> : <ChevronDown className="size-4 text-slate-400" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t">
          {isLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="size-5 animate-spin" /></div>
          ) : records.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada rekam medis</p>
          ) : (
            <div className="mt-3">
              {records.map(record => <RecordCard key={record.id} record={record} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function DoctorMedicalRecordsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['doctor-patients', search, page],
    queryFn: () => patientApi.getAll({ search, page, per_page: 10 }),
    staleTime: 30000,
  })

  const patients = data?.data?.data ?? []
  const meta = data?.data?.meta

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Rekam Medis Pasien</h1>
        <p className="text-slate-500 mt-1">Lihat riwayat rekam medis per pasien</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Cari nama pasien..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="size-4" />
            {meta ? `${meta.total} pasien` : 'Daftar Pasien'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : patients.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Tidak ada pasien ditemukan</p>
          ) : (
            patients.map(patient => <PatientRecords key={patient.id} patient={patient} />)
          )}
        </CardContent>
      </Card>
    </div>
  )
}
