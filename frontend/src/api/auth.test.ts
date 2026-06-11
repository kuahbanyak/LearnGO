import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authApi } from './auth';
import apiClient from './client';

vi.mock('./client');

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should call POST /auth/register with correct data', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Registration successful',
          data: {
            id: '123',
            username: 'testuser',
            email: 'test@example.com',
            role: { id: '1', name: 'Patient' },
          },
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const registerData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        full_name: 'Test User',
        phone: '081234567890',
        gender: 'male',
        address: 'Test Address',
        blood_type: 'A',
      };

      const result = await authApi.register(registerData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', registerData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle registration errors', async () => {
      const mockError = new Error('Email already registered');
      vi.mocked(apiClient.post).mockRejectedValue(mockError);

      const registerData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        full_name: 'Test User',
      };

      await expect(authApi.register(registerData)).rejects.toThrow('Email already registered');
      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', registerData);
    });
  });

  describe('login', () => {
    it('should call POST /auth/login with credentials', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Login successful',
          data: {
            token: 'jwt.token.here',
            user: {
              id: '123',
              username: 'testuser',
              email: 'test@example.com',
              role: { id: '1', name: 'Patient' },
            },
          },
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const loginData = {
        login: 'testuser',
        password: 'Password123!',
      };

      const result = await authApi.login(loginData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', loginData);
      expect(result).toEqual(mockResponse);
      expect(result.data.data.token).toBe('jwt.token.here');
    });

    it('should handle login errors', async () => {
      const mockError = new Error('Invalid credentials');
      vi.mocked(apiClient.post).mockRejectedValue(mockError);

      const loginData = {
        login: 'testuser',
        password: 'wrongpassword',
      };

      await expect(authApi.login(loginData)).rejects.toThrow('Invalid credentials');
      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', loginData);
    });
  });

  describe('getProfile', () => {
    it('should call GET /auth/me', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Profile retrieved',
          data: {
            id: '123',
            username: 'testuser',
            email: 'test@example.com',
            role: { id: '1', name: 'Patient' },
          },
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await authApi.getProfile();

      expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockResponse);
    });

    it('should handle profile fetch errors', async () => {
      const mockError = new Error('Unauthorized');
      vi.mocked(apiClient.get).mockRejectedValue(mockError);

      await expect(authApi.getProfile()).rejects.toThrow('Unauthorized');
      expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
    });
  });

  describe('updateProfile', () => {
    it('should call PUT /auth/profile with update data', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Profile updated',
          data: {
            id: '123',
            username: 'testuser',
            email: 'test@example.com',
            role: { id: '1', name: 'Patient' },
          },
        },
      };

      vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

      const updateData = {
        full_name: 'Updated Name',
        phone: '081234567890',
        address: 'New Address',
      };

      const result = await authApi.updateProfile(updateData);

      expect(apiClient.put).toHaveBeenCalledWith('/auth/profile', updateData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle profile update errors', async () => {
      const mockError = new Error('Validation failed');
      vi.mocked(apiClient.put).mockRejectedValue(mockError);

      const updateData = {
        full_name: '',
      };

      await expect(authApi.updateProfile(updateData)).rejects.toThrow('Validation failed');
      expect(apiClient.put).toHaveBeenCalledWith('/auth/profile', updateData);
    });
  });

  describe('deleteProfile', () => {
    it('should call DELETE /auth/me', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Profile deleted',
          data: null,
        },
      };

      vi.mocked(apiClient.delete).mockResolvedValue(mockResponse);

      const result = await authApi.deleteProfile();

      expect(apiClient.delete).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockResponse);
    });

    it('should handle profile deletion errors', async () => {
      const mockError = new Error('Failed to delete profile');
      vi.mocked(apiClient.delete).mockRejectedValue(mockError);

      await expect(authApi.deleteProfile()).rejects.toThrow('Failed to delete profile');
      expect(apiClient.delete).toHaveBeenCalledWith('/auth/me');
    });
  });
});
