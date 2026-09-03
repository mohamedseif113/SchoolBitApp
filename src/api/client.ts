import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getToken, removeToken } from '../utils/secureStorage';
import { ApiError } from '../types/api';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://fingerprint-cp.mobile.net.sa/api/smos';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Bearer Token if available
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Centralized Error Handling & 401 Logout
apiClient.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data && typeof data === 'object' && data.success === false) {
      throw new ApiError(
        data.message || 'Request failed',
        response.status,
        data.errors || {},
        data
      );
    }
    return response;
  },
  async (error: AxiosError<any>) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data || {};
      let message = data.message || 'Request failed';
      const errors = data.errors || {};

      if (errors && typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0];
        if (firstKey && Array.isArray(errors[firstKey]) && errors[firstKey][0]) {
          message = errors[firstKey][0];
        }
      }

      if (status === 401) {
        const url = error.config?.url || '';
        const isAuthAttempt = url.includes('/auth/') || url === '/login';
        if (!isAuthAttempt) {
          await removeToken();
          // Dynamic import / store action call to prevent circular dependencies
          try {
            const { useAuthStore } = await import('../store/auth.store');
            useAuthStore.getState().clearAuth();
          } catch {}
        }
      }

      // 402: Subscription locked — do NOT clear token, user is still authenticated
      // The subscription is expired or locked. Show subscription screen.
      if (status === 402) {
        return Promise.reject(new ApiError(
          data.message || data.locked_message || 'الاشتراك منتهٍ أو محظور. يرجى تجديد اشتراكك.',
          402,
          errors,
          data
        ));
      }

      // 429: Rate limit exceeded
      if (status === 429) {
        return Promise.reject(new ApiError(
          data.message || 'تم تجاوز الحد المسموح به من الطلبات. يرجى الانتظار قليلاً والمحاولة مجدداً.',
          429,
          errors,
          data
        ));
      }

      // All other error statuses (401 after logout, 403, 404, 500, etc.)
      return Promise.reject(new ApiError(message, status, errors, data));
    }

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return Promise.reject(new ApiError('انتهت مهلة الاتصال بالخادم. يرجى المحاولة لاحقاً', 408));
    }

    return Promise.reject(
      new ApiError(
        error.message === 'Network Error' 
          ? 'تعذر الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت' 
          : (error.message || 'حدث خطأ غير متوقع'),
        0
      )
    );
  }
);

export default apiClient;
