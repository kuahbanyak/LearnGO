import { describe, it, expect, vi, beforeEach } from 'vitest';
import { medicalRecordApi } from './appointments';
import apiClient from './client';

vi.mock('./client');

describe('medicalRecordApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should call POST /medical-records with medical record data', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Medical record created',
          data: {
            id: '123',
            appointment_id: 'apt-123',
            complaint: 'Headache',
            diagnosis: 'Migraine',
          },
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const recordData = {
        appointment_id: 'apt-123',
        complaint: 'Headache',
        diagnosis: 'Migraine',
        icd_code: 'G43.9',
        action_taken: 'Prescribed medication',
        doctor_notes: 'Patient should rest',
        prescriptions: [
          {
            medicine_name: 'Paracetamol',
            dosage: '500mg',
            quantity: 10,
            usage_instruction: '3x daily after meals',
            notes: 'Take with water',
          },
        ],
      };

      const result = await medicalRecordApi.create(recordData);

      expect(apiClient.post).toHaveBeenCalledWith('/medical-records', recordData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle creation errors', async () => {
      const mockError = new Error('Appointment not found');
      vi.mocked(apiClient.post).mockRejectedValue(mockError);

      const recordData = {
        appointment_id: 'invalid',
        complaint: 'Test',
      };

      await expect(medicalRecordApi.create(recordData)).rejects.toThrow('Appointment not found');
    });
  });

  describe('getById', () => {
    it('should call GET /medical-records/:id', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Medical record retrieved',
          data: {
            id: '123',
            complaint: 'Headache',
            diagnosis: 'Migraine',
          },
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await medicalRecordApi.getById('123');

      expect(apiClient.get).toHaveBeenCalledWith('/medical-records/123');
      expect(result).toEqual(mockResponse);
    });

    it('should handle not found errors', async () => {
      const mockError = new Error('Medical record not found');
      vi.mocked(apiClient.get).mockRejectedValue(mockError);

      await expect(medicalRecordApi.getById('999')).rejects.toThrow('Medical record not found');
    });
  });

  describe('getByPatient', () => {
    it('should call GET /medical-records/patient/:id with pagination', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Patient medical records retrieved',
          data: [
            { id: '1', complaint: 'Headache' },
            { id: '2', complaint: 'Fever' },
          ],
          meta: { page: 1, per_page: 10, total: 2 },
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const params = { page: 1 };
      const result = await medicalRecordApi.getByPatient('patient-123', params);

      expect(apiClient.get).toHaveBeenCalledWith('/medical-records/patient/patient-123', { params });
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors when fetching patient records', async () => {
      const mockError = new Error('Patient not found');
      vi.mocked(apiClient.get).mockRejectedValue(mockError);

      await expect(medicalRecordApi.getByPatient('invalid')).rejects.toThrow('Patient not found');
    });
  });

  describe('getMy', () => {
    it('should call GET /medical-records/my with pagination', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'My medical records retrieved',
          data: [
            { id: '1', complaint: 'Headache' },
            { id: '2', complaint: 'Fever' },
          ],
          meta: { page: 1, per_page: 10, total: 2 },
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const params = { page: 1 };
      const result = await medicalRecordApi.getMy(params);

      expect(apiClient.get).toHaveBeenCalledWith('/medical-records/my', { params });
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors when fetching own records', async () => {
      const mockError = new Error('Unauthorized');
      vi.mocked(apiClient.get).mockRejectedValue(mockError);

      await expect(medicalRecordApi.getMy()).rejects.toThrow('Unauthorized');
    });
  });
});
