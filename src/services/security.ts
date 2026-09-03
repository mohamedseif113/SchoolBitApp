import { apiFetch, buildQuery } from './api';

export interface TwoFactorState {
  enabled: boolean;
  phone_masked?: string;
  method?: 'sms' | 'app' | string;
  confirmed_at?: string;
  [key: string]: any;
}

export interface SchoolSecurityState {
  two_factor_required: boolean;
  enforce_2fa_for_teachers?: boolean;
  enforce_2fa_for_staff?: boolean;
  session_timeout_minutes?: number;
  [key: string]: any;
}

export interface UserSession {
  id: string | number;
  ip_address?: string;
  user_agent?: string;
  device?: string;
  location?: string;
  is_current?: boolean;
  last_active?: string;
  created_at?: string;
  [key: string]: any;
}

export interface LoginHistoryItem {
  id: string | number;
  ip_address?: string;
  user_agent?: string;
  status: 'successful' | 'failed' | string;
  failure_reason?: string;
  location?: string;
  login_at: string;
  [key: string]: any;
}

// 2FA User Security
export async function state(): Promise<TwoFactorState> {
  return apiFetch<TwoFactorState>('/security/2fa/state');
}

export async function startEnable(phone: string): Promise<{ success: boolean; message?: string; session_id?: string }> {
  return apiFetch('/security/2fa/enable/start', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export async function confirmEnable(
  code: string,
  phone?: string
): Promise<{ success: boolean; message?: string; backup_codes?: string[] }> {
  return apiFetch('/security/2fa/enable/confirm', {
    method: 'POST',
    body: JSON.stringify({ code, ...(phone ? { phone } : {}) }),
  });
}

export async function disable(password: string): Promise<{ success: boolean; message?: string }> {
  return apiFetch('/security/2fa/disable', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

// School-wide 2FA / Security
export async function schoolState(): Promise<SchoolSecurityState> {
  return apiFetch<SchoolSecurityState>('/security/school-state');
}

export async function setSchool(required: boolean | { required: boolean; [key: string]: any }): Promise<SchoolSecurityState> {
  const body = typeof required === 'boolean' ? { required } : required;
  return apiFetch<SchoolSecurityState>('/security/school-state', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Sessions
export async function sessions(): Promise<UserSession[]> {
  return apiFetch<UserSession[]>('/security/sessions');
}

export async function revokeSession(id: string | number): Promise<{ success: boolean; message?: string }> {
  return apiFetch(`/security/sessions/${id}`, {
    method: 'DELETE',
  });
}

export async function revokeOtherSessions(): Promise<{ success: boolean; message?: string }> {
  return apiFetch('/security/sessions/revoke-others', {
    method: 'POST',
  });
}

// Login History
export async function loginHistory(limitOrParams?: number | Record<string, any>): Promise<LoginHistoryItem[]> {
  const params = typeof limitOrParams === 'number' ? { limit: limitOrParams } : (limitOrParams || {});
  return apiFetch<LoginHistoryItem[]>(`/security/login-history${buildQuery(params)}`);
}

export const securityApi = {
  state,
  startEnable,
  confirmEnable,
  disable,
  schoolState,
  setSchool,
  sessions,
  revokeSession,
  revokeOtherSessions,
  loginHistory,
};

export default securityApi;
