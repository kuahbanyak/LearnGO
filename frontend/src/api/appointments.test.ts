import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appointmentApi } from './appointments';
import apiClient from './client';

vi.mock('./client');

describe('appointmentApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should call GET /appointments with query params', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Appointments retrieved',
          data: [{ id: '1', status: 'scheduled' }],
          meta: { page: 1, per_page: 10, total: 1 },
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const params = { page: 1, per_page: 10, status: 'scheduled' };
      const result = await appointmentApi.getAll(params);

      expect(apiClient.get).toHaveBeenCalledWith('/appointments', { params });
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors when fetching appointments', async () => {
      const mockError = new Error('Failed to fetch appointments');
      vi.mocked(apiClient.get).mockRejectedValue(mockError);

      await expect(appointmentApi.getAll()).rejects.toThrow('Failed to fetch appointments');
    });
  });

  describe('getMy', () => {
    it('should call GET /appointments/my with pagination params', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'My appointments retrieved',
          data: [{ id: '1', status: 'scheduled' }],
          meta: { page: 1, per_page: 10, total: 1 },
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const params = { page: 1, per_page: 10 };
      const result = await appointmentApi.getMy(params);

      expect(apiClient.get).toHaveBeenCalledWith('/appointments/my', { params });
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors when fetching my appointments', async () => {
      const mockError = new Error('Unauthorized');
      vi.mocked(apiClient.get).mockRejectedValue(mockError);

      await expect(appointmentApi.getMy()).rejects.toThrow('Unauthorized');
    });
  });

  describe('getTodayQueue', () => {
    it('should call GET /appointments/today with date param', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Today queue retrieved',
          data: [{ id: '1', queue_number: 1 }],
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const date = '2026-05-23';
      const result = await appointmentApi.getTodayQueue(date);

      expect(apiClient.get).toHaveBeenCalledWith('/appointments/today', { params: { date } });
      expect(result).toEqual(mockResponse);
    });

    it('should call without date param when not provided', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Today queue retrieved',
          data: [],
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await appointmentApi.getTodayQueue();

      expect(apiClient.get).toHaveBeenCalledWith('/appointments/today', { params: { date: undefined } });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getById', () => {
    it('should call GET /appointments/:id', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Appointment retrieved',
          data: { id: '123', status: 'scheduled' },
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await appointmentApi.getById('123');

      expect(apiClient.get).toHaveBeenCalledWith('/appointments/123');
      expect(result).toEqual(mockResponse);
    });

    it('should handle not found errors', async () => {
      const mockError = new Error('Appointment not found');
      vi.mocked(apiClient.get).mockRejectedValue(mockError);

      await expect(appointmentApi.getById('999')).rejects.toThrow('Appointment not found');
    });
  });

  describe('book', () => {
    it('should call POST /appointments with booking data', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Appointment booked',
          data: { id: '123', status: 'scheduled' },
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const bookingData = {
        doctor_id: 'doc-123',
        schedule_id: 'sch-456',
        appointment_date: '2026-05-25',
      };

      const result = await appointmentApi.book(bookingData);

      expect(apiClient.post).toHaveBeenCalledWith('/appointments', bookingData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle booking errors', async () => {
      const mockError = new Error('Appointment quota full');
      vi.mocked(apiClient.post).mockRejectedValue(mockError);

      const bookingData = {
        doctor_id: 'doc-123',
        schedule_id: 'sch-456',
        appointment_date: '2026-05-25',
      };

      await expect(appointmentApi.book(bookingData)).rejects.toThrow('Appointment quota full');
    });
  });

  describe('updateStatus', () => {
    it('should call PATCH /appointments/:id/status', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Status updated',
          data: { id: '123', status: 'completed' },
        },
      };

      vi.mocked(apiClient.patch).mockResolvedValue(mockResponse);

      const result = await appointmentApi.updateStatus('123', 'completed');

      expect(apiClient.patch).toHaveBeenCalledWith('/appointments/123/status', { status: 'completed' });
      expect(result).toEqual(mockResponse);
    });

    it('should handle status update errors', async () => {
      const mockError = new Error('Invalid status');
      vi.mocked(apiClient.patch).mockRejectedValue(mockError);

      await expect(appointmentApi.updateStatus('123', 'invalid')).rejects.toThrow('Invalid status');
    });
  });

  describe('cancel', () => {
    it('should call PATCH /appointments/:id/cancel with reason', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Appointment cancelled',
          data: null,
        },
      };

      vi.mocked(apiClient.patch).mockResolvedValue(mockResponse);

      const result = await appointmentApi.cancel('123', 'Personal reason');

      expect(apiClient.patch).toHaveBeenCalledWith('/appointments/123/cancel', { reason: 'Personal reason' });
      expect(result).toEqual(mockResponse);
    });

    it('should call without reason when not provided', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Appointment cancelled',
          data: null,
        },
      };

      vi.mocked(apiClient.patch).mockResolvedValue(mockResponse);

      const result = await appointmentApi.cancel('123');

      expect(apiClient.patch).toHaveBeenCalledWith('/appointments/123/cancel', { reason: undefined });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('reschedule', () => {
    it('should call PATCH /appointments/:id/reschedule', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Appointment rescheduled',
          data: { id: '123', appointment_date: '2026-05-26' },
        },
      };

      vi.mocked(apiClient.patch).mockResolvedValue(mockResponse);

      const rescheduleData = {
        schedule_id: 'sch-789',
        appointment_date: '2026-05-26',
      };

      const result = await appointmentApi.reschedule('123', rescheduleData);

      expect(apiClient.patch).toHaveBeenCalledWith('/appointments/123/reschedule', rescheduleData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle reschedule errors', async () => {
      const mockError = new Error('Schedule not available');
      vi.mocked(apiClient.patch).mockRejectedValue(mockError);

      const rescheduleData = {
        schedule_id: 'sch-789',
        appointment_date: '2026-05-26',
      };

      await expect(appointmentApi.reschedule('123', rescheduleData)).rejects.toThrow('Schedule not available');
    });
  });
});
