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
