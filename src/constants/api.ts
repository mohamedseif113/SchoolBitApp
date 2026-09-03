export const API_BASE_URL = 'https://fingerprint-cp.mobile.net.sa/api/smos';
export const TOKEN_KEY = 'smos_token';
export const REFRESH_TOKEN_KEY = 'smos_refresh_token';
export const USER_STORAGE_KEY = 'smos_user_data';
export const ACTIVE_SCHOOL_KEY = 'smos_active_school';
export const APP_LANGUAGE_KEY = 'smos_app_language';

/**
 * Network timeout in milliseconds
 */
export const API_TIMEOUT = 30000;

/**
 * Standard API Endpoints
 */
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    VERIFY_OTP: '/auth/verify-otp',
    RESEND_OTP: '/auth/resend-otp',
  },

  // Schools & Campuses
  SCHOOLS: {
    LIST: '/schools',
    DETAIL: (id: string | number) => `/schools/${id}`,
    SELECT_ACTIVE: (id: string | number) => `/schools/${id}/select`,
    CAMPUSES: (schoolId: string | number) => `/schools/${schoolId}/campuses`,
    STATISTICS: (schoolId: string | number) => `/schools/${schoolId}/statistics`,
  },

  // Attendance & Fingerprint
  ATTENDANCE: {
    SUMMARY: '/attendance/summary',
    DAILY: '/attendance/daily',
    LOGS: '/attendance/logs',
    CHECK_IN: '/attendance/check-in',
    CHECK_OUT: '/attendance/check-out',
    RECORDS: '/attendance/records',
    LEAVES: '/attendance/leaves',
    LEAVE_REQUEST: '/attendance/leaves/request',
    JUSTIFICATIONS: '/attendance/justifications',
    DEVICES: '/attendance/devices',
  },

  // Users & Staff
  USERS: {
    LIST: '/users',
    DETAIL: (id: string | number) => `/users/${id}`,
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    TEACHERS: '/teachers',
    STAFF: '/staff',
    STUDENTS: '/students',
    PARENTS: '/parents',
  },

  // Academic Structure
  ACADEMIC: {
    YEARS: '/academic-years',
    TERMS: '/academic-terms',
    STAGES: '/stages',
    GRADES: '/grades',
    SECTIONS: '/sections',
    SUBJECTS: '/subjects',
    TIMETABLE: '/timetable',
  },

  // Notifications & Announcements
  NOTIFICATIONS: {
    LIST: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    MARK_READ: (id: string | number) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    ANNOUNCEMENTS: '/announcements',
    SEND_ANNOUNCEMENT: '/announcements/send',
  },

  // Reports
  REPORTS: {
    ATTENDANCE_SUMMARY: '/reports/attendance-summary',
    STAFF_ATTENDANCE: '/reports/staff-attendance',
    STUDENT_ATTENDANCE: '/reports/student-attendance',
    MONTHLY_SHEET: '/reports/monthly-sheet',
    EXPORT: '/reports/export',
  },

  // System & Settings
  SYSTEM: {
    SETTINGS: '/settings',
    REGIONS: '/regions',
    CITIES: (regionId: string | number) => `/regions/${regionId}/cities`,
    APP_VERSION: '/system/version',
  },
} as const;
