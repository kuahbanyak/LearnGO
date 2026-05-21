export interface Role {
  id: string
  role_name: string
}

export type UserRole = 'Admin' | 'Doctor' | 'Patient'

export interface User {
  id: string
  username: string
  email: string
  full_name?: string
  phone?: string
  nik?: string
  gender?: 'male' | 'female'
  address?: string
  blood_type?: 'A' | 'B' | 'AB' | 'O'
  role?: Role
  is_active: boolean
  patient?: Patient
  doctor?: Doctor
}

export interface Patient {
  id: string
  user_id: string
  full_name: string
  phone: string
  nik?: string
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
  full_name: string
  phone: string
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

// ── Extended Dashboard Stats ──

export interface AdminDashboardStats {
  total_appointments: number
  total_checkins: number
  completed_visits: number
  no_shows: number
  avg_wait_time_minutes: number
  active_doctor_count: number
}

export interface DoctorDashboardStats {
  total_scheduled: number
  checked_in_waiting: number
  completed_consultations: number
  avg_consultation_duration_minutes: number
}

export interface PatientDashboardData {
  next_appointment: Appointment | null
  active_queue_ticket: QueueTicket | null
  upcoming_appointments_count: number
  completed_visits_count: number
  recent_medical_records: MedicalRecord[]
}

// ── Queue Types ──

export type QueueStatus = 'waiting' | 'called' | 'in_consultation' | 'completed' | 'no_show'

export interface QueueTicket {
  queue_number: number
  doctor_id: string
  doctor_name: string
  patient_id: string
  patient_name?: string
  current_position: number
  estimated_wait_minutes: number
  status: QueueStatus
  appointment_id: string
  checked_in_at?: string
}

// ── WebSocket Event Types ──

export interface QueueUpdateEvent {
  doctor_id: string
  current_number: number
  next_numbers: number[]
  waiting_count: number
}

export interface CheckinEvent {
  patient_name: string
  queue_number: number
  doctor_id: string
  timestamp: string
}

export interface AppointmentStatusEvent {
  appointment_id: string
  status: AppointmentStatus
  updated_at: string
}

// ── Symptom Screening ──

export type SymptomSeverity = 'mild' | 'moderate' | 'severe'

export interface SymptomScreening {
  id: string
  appointment_id: string
  patient_id: string
  symptoms: string
  severity: SymptomSeverity
  additional_notes?: string
  duration?: string
  temperature?: string
  ai_summary?: string
  created_at: string
  updated_at: string
}

// ── Analytics Data ──

export interface DailyAppointmentCount {
  date: string
  count: number
}

export interface StatusDistribution {
  waiting: number
  in_progress: number
  completed: number
  cancelled: number
}

export interface DoctorAppointmentCount {
  doctor_id: string
  doctor_name: string
  specialization: string
  count: number
}

export interface HourlyDistribution {
  hour: number
  count: number
}

export interface WeeklyTrend {
  week: string
  count: number
}

export interface AnalyticsData {
  appointments_by_day: DailyAppointmentCount[]
  status_distribution: StatusDistribution
  appointments_by_doctor: DoctorAppointmentCount[]
  peak_hours: HourlyDistribution[]
  cancellation_rate: number
  weekly_trends: WeeklyTrend[]
  total_this_month: number
  total_last_month: number
  avg_per_day: number
}

// ── String Key Type for i18n ──

export type StringKey = string & { readonly __brand: unique symbol }
