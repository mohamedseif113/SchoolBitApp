import apiClient from './client';
import { setToken, removeToken } from '../utils/secureStorage';
import {
  LoginRequest,
  LoginResponse,
  OtpRequest,
  OtpResponse,
  ResendOtpResponse,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  AccessMeResponse,
} from '../types/auth';

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/login', credentials);
  const data = response.data;
  if (data?.token) {
    await setToken(data.token);
  }
  return data;
}

export async function verifyOtp(params: OtpRequest): Promise<OtpResponse> {
  const response = await apiClient.post<OtpResponse>('/auth/2fa/verify', params);
  const data = response.data;
  if (data?.token) {
    await setToken(data.token);
  }
  return data;
}

export async function resendOtp(sessionId: string): Promise<ResendOtpResponse> {
  const response = await apiClient.post<ResendOtpResponse>('/auth/2fa/resend', {
    session_id: sessionId,
  });
  return response.data;
}

export async function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  const response = await apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', {
    email,
  });
  return response.data;
}

export async function resetPassword(payload: ResetPasswordRequest): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.post('/auth/reset-password', payload);
  return response.data;
}

export async function signup(data: any): Promise<any> {
  const response = await apiClient.post('/signup', data);
  return response.data;
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post('/logout');
  } catch (error) {
    // If logout fails on backend (e.g. token expired), we still remove local token
  } finally {
    await removeToken();
  }
}

export async function getMe(): Promise<any> {
  const response = await apiClient.get('/me');
  return response.data;
}

export async function getAccessMe(): Promise<AccessMeResponse> {
  const response = await apiClient.get('/access/me');
  return response.data;
}

export const authApi = {
  login,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  signup,
  logout,
  getMe,
  getAccessMe,
};

export default authApi;
