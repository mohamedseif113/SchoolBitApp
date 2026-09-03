import { create } from 'zustand';
import { User, School, Role, LoginRequest, OtpRequest, PortalStudent } from '../types/auth';
import { getToken, setToken, removeToken } from '../utils/secureStorage';
import { login as apiLogin, verifyOtp as apiVerifyOtp, logout as apiLogout, getMe, getAccessMe } from '../api/auth';
import { requestPortalCode, verifyPortalCode, getPortalMe, portalLogout as apiPortalLogout } from '../api/portal';

export interface AuthState {
  token: string | null;
  user: User | null;
  school: School | null;
  role: Role;
  permissions: string[];
  modules: Record<string, boolean>;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  locked: boolean;
  isOwner: boolean;
  trialEndsAt: string | null;
  trialDaysLeft: number | null;

  // Portal (Student / Parent) specific state
  portalStudents: PortalStudent[];
  selectedStudent: PortalStudent | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<{ requires_2fa?: boolean; session_id?: string; phone_masked?: string; [key: string]: any }>;
  verifyOtp: (params: OtpRequest) => Promise<void>;
  portalRequestCode: (phone: string) => Promise<{ success: boolean; data: { sent: boolean; expires_in: number }; message?: string }>;
  portalVerifyCode: (phone: string, code: string, intentRole?: 'student' | 'parent') => Promise<void>;
  setSelectedStudent: (student: PortalStudent) => void;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  setAuth: (data: {
    user: User;
    school?: School | null;
    role?: string;
    isOwner?: boolean;
    token: string;
    trialEndsAt?: string;
    trialDaysLeft?: number;
  }) => Promise<void>;
  setAccess: (data: {
    isOwner?: boolean;
    permissions?: string[];
    modules?: Record<string, boolean>;
    locked?: boolean;
    roleSlug?: string;
  }) => void;
  clearAuth: () => Promise<void>;
  hasPermission: (perm: string) => boolean;
  hasAnyPermission: (...perms: string[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  school: null,
  role: null,
  permissions: [],
  modules: {},
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true,
  locked: false,
  isOwner: false,
  trialEndsAt: null,
  trialDaysLeft: null,

  portalStudents: [],
  selectedStudent: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setSelectedStudent: (student) => {
    set({
      selectedStudent: student,
      user: {
        id: student.id,
        name: student.name,
        email: '',
        class_number: student.class_number,
        class_name: student.class_name,
        school: student.school,
      },
    });
  },

  setAuth: async ({ user, school, role, isOwner = false, token, trialEndsAt, trialDaysLeft }) => {
    await setToken(token);
    set({
      token,
      user,
      school: school ?? null,
      role: role ?? null,
      isOwner,
      isAuthenticated: true,
      trialEndsAt: trialEndsAt ?? null,
      trialDaysLeft: trialDaysLeft ?? null,
    });
  },

  setAccess: ({ isOwner = false, permissions = [], modules = {}, locked = false, roleSlug }) => {
    set((s) => ({
      isOwner,
      permissions,
      modules,
      locked,
      role: roleSlug ?? s.role,
    }));
  },

  clearAuth: async () => {
    await removeToken();
    set({
      token: null,
      user: null,
      school: null,
      role: null,
      permissions: [],
      modules: {},
      isAuthenticated: false,
      isOwner: false,
      locked: false,
      trialEndsAt: null,
      trialDaysLeft: null,
      portalStudents: [],
      selectedStudent: null,
    });
  },

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const res = await apiLogin(credentials);
      
      const requires2FA = res?.requires_2fa || res?.data?.requires_2fa;
      if (requires2FA) {
        return res;
      }

      const token = res?.token || res?.data?.token || res?.access_token;
      let user = res?.user || res?.data?.user;

      if (token) {
        await setToken(token);

        if (!user) {
          try {
            const meData = await getMe();
            user = meData?.user || meData?.data?.user || (meData?.id ? meData : null);
          } catch {}
        }

        const fallbackUser: User = {
          id: 1,
          name: user?.name || credentials.email.split('@')[0] || 'User',
          email: credentials.email,
        };

        const resolvedRole = res?.role || res?.data?.role || user?.role || 'staff';

        await get().setAuth({
          token,
          user: user || fallbackUser,
          school: res?.school || res?.data?.school || null,
          role: resolvedRole,
          trialEndsAt: res?.trial_ends_at || res?.data?.trial_ends_at,
          trialDaysLeft: res?.trial_days_left || res?.data?.trial_days_left,
        });

        try {
          const access = await getAccessMe();
          const accessData = access?.data ?? access;
          if (accessData) {
            get().setAccess({
              isOwner: !!accessData?.is_owner,
              permissions: Array.isArray(accessData?.permissions) ? accessData.permissions : [],
              modules: accessData?.modules && typeof accessData.modules === 'object' ? accessData.modules : {},
              locked: !!accessData?.locked,
              roleSlug: accessData?.role?.slug,
            });
          }
        } catch {}
      }
      return res;
    } finally {
      set({ isLoading: false });
    }
  },

  verifyOtp: async (params) => {
    set({ isLoading: true });
    try {
      const res = await apiVerifyOtp(params);
      const token = res?.token || res?.data?.token || res?.access_token;
      let user = res?.user || res?.data?.user;

      if (token) {
        await setToken(token);

        if (!user) {
          try {
            const meData = await getMe();
            user = meData?.user || meData?.data?.user || (meData?.id ? meData : null);
          } catch {}
        }

        const fallbackUser: User = {
          id: 1,
          name: user?.name || 'User',
          email: '',
        };

        await get().setAuth({
          token,
          user: user || fallbackUser,
          school: res?.school || res?.data?.school || null,
          role: res?.role || res?.data?.role || null,
          trialEndsAt: res?.trial_ends_at || res?.data?.trial_ends_at,
          trialDaysLeft: res?.trial_days_left || res?.data?.trial_days_left,
        });

        try {
          const access = await getAccessMe();
          const accessData = access?.data ?? access;
          if (accessData) {
            get().setAccess({
              isOwner: !!accessData?.is_owner,
              permissions: Array.isArray(accessData?.permissions) ? accessData.permissions : [],
              modules: accessData?.modules && typeof accessData.modules === 'object' ? accessData.modules : {},
              locked: !!accessData?.locked,
              roleSlug: accessData?.role?.slug,
            });
          }
        } catch {}
      }
    } finally {
      set({ isLoading: false });
    }
  },

  portalRequestCode: async (phone: string) => {
    set({ isLoading: true });
    try {
      return await requestPortalCode(phone);
    } finally {
      set({ isLoading: false });
    }
  },

  portalVerifyCode: async (phone: string, code: string, intentRole?: 'student' | 'parent') => {
    set({ isLoading: true });
    try {
      const res = await verifyPortalCode(phone, code);
      const data = res?.data || res;
      const token = data?.token || (res as any)?.token || (res as any)?.access_token;

      if (token) {
        await setToken(token);
        const students = Array.isArray(data?.students)
          ? data.students
          : Array.isArray((res as any)?.students)
          ? (res as any).students
          : [];
        const firstStudent = students[0] || null;

        // Determine authenticated role from backend context
        const assignedRole = intentRole === 'parent' || students.length > 1 ? 'parent' : 'student';

        const portalUser: User = {
          id: firstStudent?.id || 1,
          name: firstStudent?.name || (assignedRole === 'parent' ? 'ولي أمر' : 'طالب'),
          email: '',
          phone: data?.phone || (res as any)?.phone || phone,
          class_number: firstStudent?.class_number,
          school: firstStudent?.school,
        };

        const portalSchool: School = {
          id: 1,
          name: firstStudent?.school || null,
          logo_url: null,
        };

        set({
          token,
          user: portalUser,
          school: portalSchool,
          role: assignedRole,
          portalStudents: students,
          selectedStudent: firstStudent,
          isAuthenticated: true,
          permissions: [],
          modules: {},
          locked: false,
        });
      } else {
        throw new Error(res?.message || 'لم يتم استلام رمز التوثيق من الخادم');
      }
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      const role = get().role;
      if (role === 'student' || role === 'parent') {
        await apiPortalLogout();
      } else {
        await apiLogout();
      }
    } catch {
      // Always clear local session
    } finally {
      await get().clearAuth();
      set({ isLoading: false });
    }
  },

  initializeAuth: async () => {
    set({ isInitializing: true });
    try {
      const token = await getToken();
      if (!token) {
        await get().clearAuth();
        return;
      }

      // 1. Try Staff / Me endpoint first
      try {
        const meData = await getMe();
        const user = meData?.user || meData?.data?.user || (meData?.id ? meData : null);
        
        if (user) {
          set({
            token,
            user: user,
            school: meData?.school ?? meData?.data?.school ?? null,
            role: meData?.role ?? meData?.data?.role ?? 'staff',
            isAuthenticated: true,
            trialEndsAt: meData?.trial_ends_at ?? null,
            trialDaysLeft: meData?.trial_days_left ?? null,
          });

          try {
            const access = await getAccessMe();
            const accessData = access?.data ?? access;
            if (accessData) {
              get().setAccess({
                isOwner: !!accessData?.is_owner,
                permissions: Array.isArray(accessData?.permissions) ? accessData.permissions : [],
                modules: accessData?.modules && typeof accessData.modules === 'object' ? accessData.modules : {},
                locked: !!accessData?.locked,
                roleSlug: accessData?.role?.slug,
              });
            }
          } catch {}
          return;
        }
      } catch (staffErr: any) {
        // If staff endpoint returns 401, check if this is a portal token
      }

      // 2. Try Student / Parent Portal endpoint
      try {
        const portalMe = await getPortalMe();
        const portalData = portalMe?.data || portalMe;
        if (portalData && (portalData.students || portalData.phone)) {
          const students = Array.isArray(portalData.students) ? portalData.students : [];
          const firstStudent = students[0] || null;
          const assignedRole = students.length > 1 ? 'parent' : 'student';

          set({
            token,
            user: {
              id: firstStudent?.id || 1,
              name: firstStudent?.name || (assignedRole === 'parent' ? 'ولي أمر' : 'طالب'),
              email: '',
              phone: portalData.phone,
              class_number: firstStudent?.class_number,
              school: firstStudent?.school,
            },
            school: {
              id: 1,
              name: firstStudent?.school || null,
              logo_url: null,
            },
            role: assignedRole,
            portalStudents: students,
            selectedStudent: firstStudent,
            isAuthenticated: true,
            permissions: [],
            modules: {},
            locked: false,
          });
          return;
        }
      } catch (portalErr: any) {
        // Both failed
        if (portalErr?.status === 401) {
          await get().clearAuth();
          return;
        }
      }

      // If we still have token, keep active user session
      set({
        token,
        user: { id: 1, name: 'User', email: '' },
        isAuthenticated: true,
      });
    } finally {
      set({ isInitializing: false });
    }
  },

  hasPermission: (perm) => {
    const { isOwner, permissions } = get();
    return isOwner || permissions.includes(perm);
  },

  hasAnyPermission: (...perms) => {
    const { isOwner, permissions } = get();
    return isOwner || perms.some((p) => permissions.includes(p));
  },
}));

export default useAuthStore;
