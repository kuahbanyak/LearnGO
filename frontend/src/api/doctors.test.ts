import { describe, it, expect, vi, beforeEach } from 'vitest';
import { doctorApi, scheduleApi } from './doctors';
import apiClient from './client';

vi.mock('./client');

describe('doctorApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should call GET /doctors with pagination params', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Doctors retrieved',
          data: [
            { id: '1', full_name: 'Dr. John Doe', specialization: 'Cardiology' },
            { id: '2', full_name: 'Dr. Jane Smith', specialization: 'Neurology' },
          ],
          meta: { page: 1, per_page: 10, total: 2 },
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const params = { page: 1, per_page: 10 };
      const result = await doctorApi.getAll(params);

      expect(apiClient.get).toHaveBeenCalledWith('/doctors', { params });
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors when fetching doctors', async () => {
      const mockError = new Error('Failed to fetch doctors');
      vi.mocked(apiClient.get).mockRejectedValue(mockError);

      await expect(doctorApi.getAll()).rejects.toThrow('Failed to fetch doctors');
    });
  });

  describe('getById', () => {
    it('should call GET /doctors/:id', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Doctor retrieved',
          data: { id: '123', full_name: 'Dr. John Doe', specialization: 'Cardiology' },
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await doctorApi.getById('123');

      expect(apiClient.get).toHaveBeenCalledWith('/doctors/123');
      expect(result).toEqual(mockResponse);
    });

    it('should handle not found errors', async () => {
      const mockError = new Error('Doctor not found');
      vi.mocked(apiClient.get).mockRejectedValue(mockError);

      await expect(doctorApi.getById('999')).rejects.toThrow('Doctor not found');
    });
  });

  describe('create', () => {
    it('should call POST /doctors with doctor data', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Doctor created',
          data: { id: '123', full_name: 'Dr. John Doe' },
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const doctorData = {
        username: 'drjohn',
        email: 'drjohn@example.com',
        password: 'Password123!',
        full_name: 'Dr. John Doe',
        phone: '081234567890',
        specialization: 'Cardiology',
        sip_number: 'SIP12345',
      };

      const result = await doctorApi.create(doctorData);

      expect(apiClient.post).toHaveBeenCalledWith('/doctors', doctorData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle creation errors', async () => {
      const mockError = new Error('Email already registered');
      vi.mocked(apiClient.post).mockRejectedValue(mockError);

      const doctorData = {
        username: 'drjohn',
        email: 'drjohn@example.com',
        password: 'Password123!',
        full_name: 'Dr. John Doe',
        specialization: 'Cardiology',
        sip_number: 'SIP12345',
      };

      await expect(doctorApi.create(doctorData)).rejects.toThrow('Email already registered');
    });
  });

  describe('update', () => {
    it('should call PUT /doctors/:id with update data', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Doctor updated',
          data: { id: '123', full_name: 'Dr. John Doe Updated' },
        },
      };

      vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

      const updateData = {
        full_name: 'Dr. John Doe Updated',
        specialization: 'Neurology',
      };

      const result = await doctorApi.update('123', updateData);

      expect(apiClient.put).toHaveBeenCalledWith('/doctors/123', updateData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle update errors', async () => {
      const mockError = new Error('Doctor not found');
      vi.mocked(apiClient.put).mockRejectedValue(mockError);

      await expect(doctorApi.update('999', { full_name: 'Test' })).rejects.toThrow('Doctor not found');
    });
  });

  describe('delete', () => {
    it('should call DELETE /doctors/:id', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Doctor deleted',
          data: null,
        },
      };

      vi.mocked(apiClient.delete).mockResolvedValue(mockResponse);

      const result = await doctorApi.delete('123');

      expect(apiClient.delete).toHaveBeenCalledWith('/doctors/123');
      expect(result).toEqual(mockResponse);
    });

    it('should handle deletion errors', async () => {
      const mockError = new Error('Doctor not found');
      vi.mocked(apiClient.delete).mockRejectedValue(mockError);

      await expect(doctorApi.delete('999')).rejects.toThrow('Doctor not found');
    });
  });
});

describe('scheduleApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should call GET /schedules', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Schedules retrieved',
          data: [
            { id: '1', day_of_week: 1, start_time: '08:00', end_time: '12:00' },
            { id: '2', day_of_week: 2, start_time: '13:00', end_time: '17:00' },
          ],
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await scheduleApi.getAll();

      expect(apiClient.get).toHaveBeenCalledWith('/schedules');
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors when fetching schedules', async () => {
      const mockError = new Error('Failed to fetch schedules');
      vi.mocked(apiClient.get).mockRejectedValue(mockError);

      await expect(scheduleApi.getAll()).rejects.toThrow('Failed to fetch schedules');
    });
  });

  describe('getByDoctor', () => {
    it('should call GET /schedules/doctor/:id', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Doctor schedules retrieved',
          data: [{ id: '1', day_of_week: 1, start_time: '08:00' }],
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await scheduleApi.getByDoctor('doc-123');

      expect(apiClient.get).toHaveBeenCalledWith('/schedules/doctor/doc-123');
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors when fetching doctor schedules', async () => {
      const mockError = new Error('Doctor not found');
      vi.mocked(apiClient.get).mockRejectedValue(mockError);

      await expect(scheduleApi.getByDoctor('invalid')).rejects.toThrow('Doctor not found');
    });
  });

  describe('getAvailability', () => {
    it('should call GET /schedules/doctor/:id/availability with date params', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Availability retrieved',
          data: [{ date: '2026-05-23', available_slots: 10 }],
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const params = { start_date: '2026-05-23', end_date: '2026-05-30' };
      const result = await scheduleApi.getAvailability('doc-123', params);

      expect(apiClient.get).toHaveBeenCalledWith('/schedules/doctor/doc-123/availability', { params });
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors when fetching availability', async () => {
      const mockError = new Error('Invalid date range');
      vi.mocked(apiClient.get).mockRejectedValue(mockError);

      await expect(scheduleApi.getAvailability('doc-123')).rejects.toThrow('Invalid date range');
    });
  });

  describe('create', () => {
    it('should call POST /schedules with schedule data', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Schedule created',
          data: { id: '123', day_of_week: 1, start_time: '08:00' },
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const scheduleData = {
        doctor_id: 'doc-123',
        day_of_week: 1,
        start_time: '08:00',
        end_time: '12:00',
        max_patient: 20,
      };

      const result = await scheduleApi.create(scheduleData);

      expect(apiClient.post).toHaveBeenCalledWith('/schedules', scheduleData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle creation errors', async () => {
      const mockError = new Error('Schedule conflict');
      vi.mocked(apiClient.post).mockRejectedValue(mockError);

      const scheduleData = {
        doctor_id: 'doc-123',
        day_of_week: 1,
        start_time: '08:00',
        end_time: '12:00',
        max_patient: 20,
      };

      await expect(scheduleApi.create(scheduleData)).rejects.toThrow('Schedule conflict');
    });
  });

  describe('update', () => {
    it('should call PUT /schedules/:id with update data', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Schedule updated',
          data: { id: '123', start_time: '09:00' },
        },
      };

      vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

      const updateData = { start_time: '09:00', end_time: '13:00' };
      const result = await scheduleApi.update('123', updateData);

      expect(apiClient.put).toHaveBeenCalledWith('/schedules/123', updateData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle update errors', async () => {
      const mockError = new Error('Schedule not found');
      vi.mocked(apiClient.put).mockRejectedValue(mockError);

      await expect(scheduleApi.update('999', {})).rejects.toThrow('Schedule not found');
    });
  });

  describe('delete', () => {
    it('should call DELETE /schedules/:id', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Schedule deleted',
          data: null,
        },
      };

      vi.mocked(apiClient.delete).mockResolvedValue(mockResponse);

      const result = await scheduleApi.delete('123');

      expect(apiClient.delete).toHaveBeenCalledWith('/schedules/123');
      expect(result).toEqual(mockResponse);
    });

    it('should handle deletion errors', async () => {
      const mockError = new Error('Schedule not found');
      vi.mocked(apiClient.delete).mockRejectedValue(mockError);

      await expect(scheduleApi.delete('999')).rejects.toThrow('Schedule not found');
    });
  });

  describe('toggle', () => {
    it('should call PATCH /schedules/:id/toggle', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Schedule toggled',
          data: { id: '123', is_active: false },
        },
      };

      vi.mocked(apiClient.patch).mockResolvedValue(mockResponse);

      const result = await scheduleApi.toggle('123');

      expect(apiClient.patch).toHaveBeenCalledWith('/schedules/123/toggle');
      expect(result).toEqual(mockResponse);
    });

    it('should handle toggle errors', async () => {
      const mockError = new Error('Schedule not found');
      vi.mocked(apiClient.patch).mockRejectedValue(mockError);

      await expect(scheduleApi.toggle('999')).rejects.toThrow('Schedule not found');
    });
  });
});
