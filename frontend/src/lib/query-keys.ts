// --- staleTime / gcTime configuration per data domain ---

/** Semi-static data: doctors, schedules, patients, users */
export const STALE_TIME_STATIC = 5 * 60 * 1000 // 5 minutes (300 000 ms)
export const GC_TIME_STATIC = 10 * 60 * 1000 // 10 minutes

/** Frequently changing: dashboard stats, queue data */
export const STALE_TIME_DASHBOARD = 30 * 1000 // 30 seconds
export const GC_TIME_DASHBOARD = 60 * 1000 // 1 minute

/** Moderate frequency: appointment lists */
export const STALE_TIME_APPOINTMENTS = 60 * 1000 // 1 minute (60 000 ms)
export const GC_TIME_APPOINTMENTS = 5 * 60 * 1000 // 5 minutes

/** Analytics and medical records */
export const STALE_TIME_RECORDS = 5 * 60 * 1000 // 5 minutes (300 000 ms)
export const GC_TIME_RECORDS = 10 * 60 * 1000 // 10 minutes

/** Ratings — least volatile */
export const STALE_TIME_RATINGS = 10 * 60 * 1000 // 10 minutes (600 000 ms)
export const GC_TIME_RATINGS = 30 * 60 * 1000 // 30 minutes

/**
 * Lookup map: query key prefix → { staleTime, gcTime }
 * Useful for configuring TanStack Query defaults per domain.
 */
export const queryConfig = {
  doctors: { staleTime: STALE_TIME_STATIC, gcTime: GC_TIME_STATIC },
  schedules: { staleTime: STALE_TIME_STATIC, gcTime: GC_TIME_STATIC },
  patients: { staleTime: STALE_TIME_STATIC, gcTime: GC_TIME_STATIC },
  users: { staleTime: STALE_TIME_STATIC, gcTime: GC_TIME_STATIC },
  dashboard: { staleTime: STALE_TIME_DASHBOARD, gcTime: GC_TIME_DASHBOARD },
  appointments: { staleTime: STALE_TIME_APPOINTMENTS, gcTime: GC_TIME_APPOINTMENTS },
  analytics: { staleTime: STALE_TIME_RECORDS, gcTime: GC_TIME_RECORDS },
  medicalRecords: { staleTime: STALE_TIME_RECORDS, gcTime: GC_TIME_RECORDS },
  ratings: { staleTime: STALE_TIME_RATINGS, gcTime: GC_TIME_RATINGS },
} as const

export const queryKeys = {
  // Doctors
  doctors: {
    all: ['doctors'] as const,
    lists: () => [...queryKeys.doctors.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.doctors.lists(), { filters }] as const,
    details: () => [...queryKeys.doctors.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.doctors.details(), id] as const,
  },

  // Schedules
  schedules: {
    all: ['schedules'] as const,
    lists: () => [...queryKeys.schedules.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.schedules.lists(), { filters }] as const,
    byDoctor: (doctorId: string) => [...queryKeys.schedules.all, 'doctor', doctorId] as const,
  },

  // Appointments
  appointments: {
    all: ['appointments'] as const,
    lists: () => [...queryKeys.appointments.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.appointments.lists(), { filters }] as const,
    my: () => [...queryKeys.appointments.all, 'my'] as const,
    detail: (id: string) => [...queryKeys.appointments.all, id] as const,
    todayQueue: () => [...queryKeys.appointments.all, 'today-queue'] as const,
  },

  // Patients
  patients: {
    all: ['patients'] as const,
    lists: () => [...queryKeys.patients.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.patients.lists(), { filters }] as const,
    detail: (id: string) => [...queryKeys.patients.all, id] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.users.lists(), { filters }] as const,
    detail: (id: string) => [...queryKeys.users.all, id] as const,
  },

  // Dashboard
  dashboard: {
    admin: () => ['dashboard', 'admin'] as const,
    doctor: () => ['dashboard', 'doctor'] as const,
    patient: () => ['dashboard', 'patient'] as const,
  },

  // Analytics
  analytics: {
    all: ['analytics'] as const,
  },

  // Medical Records
  medicalRecords: {
    all: ['medical-records'] as const,
    my: () => [...queryKeys.medicalRecords.all, 'my'] as const,
    byPatient: (patientId: string) => [...queryKeys.medicalRecords.all, 'patient', patientId] as const,
    detail: (id: string) => [...queryKeys.medicalRecords.all, id] as const,
  },

  // Ratings
  ratings: {
    all: ['ratings'] as const,
    byDoctor: (doctorId: string) => [...queryKeys.ratings.all, 'doctor', doctorId] as const,
    summary: (doctorId: string) => [...queryKeys.ratings.all, 'summary', doctorId] as const,
  },

  // Auth
  auth: {
    me: () => ['auth', 'me'] as const,
  },
}
