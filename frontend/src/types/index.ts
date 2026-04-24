export interface User {
  id: string
  email: string
  role: 'admin' | 'doctor' | 'patient'
  full_name: string
  phone: string
  nik?: string
  gender?: string
  address?: string
  blood_type?: string
  is_active: boolean
  patient?: Patient
  doctor?: Doctor
}

export interface Patient {
  id: string
  user_id: string
  nik: string
  date_of_birth?: string
  gender?: 'male' | 'female'
  address?: string
  blood_type?: 'A' | 'B' | 'AB' | 'O'
  allergies?: string
  user?: User
}

export interface Doctor {
  id: string
  user_id: string
  specialization: string
  sip_number: string
  user?: User
  schedules?: DoctorSchedule[]
}

export interface DoctorSchedule {
  id: string
  doctor_id: string
  day_of_week: number
  start_time: string
  end_time: string
  max_patient: number
  is_active: boolean
  doctor?: Doctor
}

export type AppointmentStatus = 'waiting' | 'in_progress' | 'completed' | 'cancelled'

export interface Appointment {
  id: string
  patient_id: string
  doctor_id: string
  schedule_id: string
  appointment_date: string
  queue_number: number
  status: AppointmentStatus
  cancel_reason?: string
  checked_in_at?: string
  completed_at?: string
  patient?: Patient
  doctor?: Doctor
  schedule?: DoctorSchedule
  medical_record?: MedicalRecord
}

export interface MedicalRecord {
  id: string
  appointment_id: string
  patient_id: string
  doctor_id: string
  complaint: string
  diagnosis?: string
  icd_code?: string
  action_taken?: string
  doctor_notes?: string
  created_at: string
  doctor?: Doctor
  patient?: Patient
  appointment?: Appointment
  prescriptions?: Prescription[]
}

export interface Prescription {
  id: string
  medical_record_id: string
  medicine_name: string
  dosage: string
  quantity: number
  usage_instruction?: string
  notes?: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
  errors?: unknown
}

export interface PaginatedResponse<T> {
  success: boolean
  message: string
  data: T[]
  meta: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

export interface DashboardStats {
  total_patients: number
  today_visits: number
  active_doctors: number
  today_queue: number
  completed_today: number
  waiting_now: number
}
