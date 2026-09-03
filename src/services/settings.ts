import { apiFetch } from './api';

export interface SchoolSettings {
  name?: string;
  name_ar?: string;
  logo?: string;
  phone?: string;
  email?: string;
  address?: string;
  academic_year?: string;
  term?: string;
  [key: string]: any;
}

export interface NotificationSettings {
  email_notifications?: boolean;
  sms_notifications?: boolean;
  push_notifications?: boolean;
  notify_behavior_incidents?: boolean;
  notify_task_assignments?: boolean;
  notify_messages?: boolean;
  [key: string]: any;
}

export interface PreferencesSettings {
  language?: 'ar' | 'en';
  theme?: 'light' | 'dark' | 'system';
  direction?: 'rtl' | 'ltr';
  date_format?: string;
  time_format?: '12h' | '24h';
  [key: string]: any;
}

export interface ProfileData {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  job_title?: string;
  [key: string]: any;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
  [key: string]: any;
}

export type FileUpload = FormData | { uri: string; name?: string; type?: string } | Blob | any;

export async function school(): Promise<SchoolSettings> {
  return apiFetch<SchoolSettings>('/settings/school');
}

export async function updateSchool(data: Partial<SchoolSettings> | FormData): Promise<SchoolSettings> {
  const isFormData = data instanceof FormData;
  return apiFetch<SchoolSettings>('/settings/school', {
    method: 'POST',
    body: isFormData ? data : JSON.stringify(data),
  });
}

export async function notifications(): Promise<NotificationSettings> {
  return apiFetch<NotificationSettings>('/settings/notifications');
}

export async function updateNotifications(data: Partial<NotificationSettings>): Promise<NotificationSettings> {
  return apiFetch<NotificationSettings>('/settings/notifications', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function preferences(): Promise<PreferencesSettings> {
  return apiFetch<PreferencesSettings>('/settings/preferences');
}

export async function savePreferences(data: Partial<PreferencesSettings>): Promise<PreferencesSettings> {
  return apiFetch<PreferencesSettings>('/settings/preferences', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function profile(): Promise<ProfileData> {
  return apiFetch<ProfileData>('/settings/profile');
}

export async function updateProfile(data: Partial<ProfileData> | FormData): Promise<ProfileData> {
  const isFormData = data instanceof FormData;
  return apiFetch<ProfileData>('/settings/profile', {
    method: 'POST',
    body: isFormData ? data : JSON.stringify(data),
  });
}

export async function changePassword(data: ChangePasswordData): Promise<{ success: boolean; message?: string }> {
  return apiFetch('/settings/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function uploadLogo(file: FileUpload): Promise<{ url: string; [key: string]: any }> {
  let body: FormData;
  if (file instanceof FormData) {
    body = file;
  } else {
    body = new FormData();
    body.append('logo', file as any);
  }
  return apiFetch('/settings/school/logo', {
    method: 'POST',
    body,
  });
}

export async function uploadAvatar(file: FileUpload): Promise<{ url: string; [key: string]: any }> {
  let body: FormData;
  if (file instanceof FormData) {
    body = file;
  } else {
    body = new FormData();
    body.append('avatar', file as any);
  }
  return apiFetch('/settings/avatar', {
    method: 'POST',
    body,
  });
}

export const settingsApi = {
  school,
  updateSchool,
  notifications,
  updateNotifications,
  preferences,
  savePreferences,
  profile,
  updateProfile,
  changePassword,
  uploadLogo,
  uploadAvatar,
};

export default settingsApi;
