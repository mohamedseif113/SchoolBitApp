export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  [key: string]: any;
}

export interface School {
  id?: number;
  name: string | null;
  logo_url: string | null;
  [key: string]: any;
}

export type Role = 'principal' | 'vice' | 'counselor' | 'accountant' | 'teacher' | string | null;

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface LoginResponse {
  token?: string;
  user?: User;
  school?: School;
  role?: string;
  requires_2fa?: boolean;
  session_id?: string;
  phone_masked?: string;
  trial_ends_at?: string;
  trial_days_left?: number;
  message?: string;
  [key: string]: any;
}

export interface OtpRequest {
  session_id: string;
  code: string;
}

export interface OtpResponse {
  token?: string;
  user?: User;
  school?: School;
  role?: string;
  trial_ends_at?: string;
  trial_days_left?: number;
  message?: string;
  [key: string]: any;
}

export interface ResendOtpResponse {
  success: boolean;
  message?: string;
  phone_masked?: string;
  masked_phone?: string;
  expires_in?: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message?: string;
  phone?: string;
  session_id?: string;
  [key: string]: any;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  password?: string;
  password_confirmation?: string;
}

export interface AccessMeResponse {
  is_owner?: boolean;
  permissions?: string[];
  modules?: Record<string, boolean>;
  locked?: boolean;
  role?: {
    slug?: string;
    name?: string;
  };
  [key: string]: any;
}

export interface PortalStudent {
  id: number;
  name: string;
  class_number?: string;
  class_name?: string;
  grade_name?: string;
  school?: string;
  avatar_url?: string | null;
}

