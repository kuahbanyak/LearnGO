import apiClient from './client'

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

export const analyticsApi = {
  getAnalytics: (days: number = 30) =>
    apiClient.get<{ success: boolean; message: string; data: AnalyticsData }>('/analytics', {
      params: { days },
    }),
}
