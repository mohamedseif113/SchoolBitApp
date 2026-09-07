import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Platform,
  Modal,
  LayoutAnimation,
  Alert,
  Animated,
  I18nManager,
  PanResponder,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../../store/auth.store';
import { useUiStore } from '../../store/uiStore';
import { useDashboard } from '../../hooks/useDashboard';
import { useAppDirection } from '../../hooks/useAppDirection';
import { useNavigationLoading } from '../../store/useNavigationLoading';
import { ibmPlexArabicFontFamily } from '../../theme/typography';
import { AppText } from '../common/AppText';
import { Icon, IconName } from '../common/Icon';
import { PageSkeletonSelector } from '../skeletons/PageSkeletons';

export interface WebDashboardLayoutProps {
  title?: string;
  subtitle?: string;
  unreadCount?: number;
  onOpenNotifications?: () => void;
  children: React.ReactNode;
}

export interface NavChildItem {
  id: string;
  labelAr: string;
  labelEn: string;
  route: string;
  screenName: string;
  params?: Record<string, any>;
  icon: IconName;
  badge?: number | string | ((badges: any) => number | string | undefined);
  permission?: string;
}

export interface NavSection {
  id: string;
  labelAr: string;
  labelEn: string;
  icon: IconName;
  badge?: number | string | ((badges: any) => number | string | undefined);
  permission?: string;
  items: NavChildItem[];
}

export const WebDashboardLayout: React.FC<WebDashboardLayoutProps> = ({
  title,
  subtitle,
  unreadCount,
  onOpenNotifications,
  children,
}) => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktop = width >= 1024;

  const { user, school, role, isOwner, hasPermission, logout } = useAuthStore();
  const { lang, theme, toggleLang, toggleTheme } = useUiStore();
  const { badges } = useDashboard();
  const { isRTL } = useAppDirection();

  const isDark = theme === 'dark';
  const drawerPosition = (isRTL || I18nManager.isRTL) ? 'right' : 'left';

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const handleOpenMobileDrawer = useCallback(() => {
    setMobileSidebarOpen(true);
    slideAnim.setValue(0);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const handleCloseMobileDrawer = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setMobileSidebarOpen(false);
    });
  }, [slideAnim]);

  // PanResponder to handle swipe gestures on open drawer (swipe right in RTL or left in LTR to close)
  const drawerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > 15 && Math.abs(dx) > Math.abs(dy) * 1.5;
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, vx } = gestureState;
        if (drawerPosition === 'right') {
          if (dx > 30 || vx > 0.3) {
            handleCloseMobileDrawer();
          }
        } else {
          if (dx < -30 || vx < -0.3) {
            handleCloseMobileDrawer();
          }
        }
      },
    })
  ).current;

  // PanResponder to handle edge swipe gestures on main area to open drawer (swipe from right edge in RTL, left edge in LTR)
  const edgePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        if (isDesktop) return false;
        const touchX = evt.nativeEvent.pageX;
        if (drawerPosition === 'right') {
          return touchX > width - 45;
        } else {
          return touchX < 45;
        }
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (isDesktop) return false;
        const touchX = evt.nativeEvent.pageX;
        const { dx, dy } = gestureState;
        const isHorizontal = Math.abs(dx) > 15 && Math.abs(dx) > Math.abs(dy) * 1.5;
        if (drawerPosition === 'right') {
          return isHorizontal && (touchX > width - 60 || dx < -15);
        } else {
          return isHorizontal && (touchX < 60 || dx > 15);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, vx } = gestureState;
        if (drawerPosition === 'right') {
          if (dx < -30 || vx < -0.3) {
            handleOpenMobileDrawer();
          }
        } else {
          if (dx > 30 || vx > 0.3) {
            handleOpenMobileDrawer();
          }
        }
      },
    })
  ).current;

  const normalizedRole = (role || '').toLowerCase();
  const isTeacher = normalizedRole.includes('teacher') || role === 'معلم' || role === 'معلمة';
  const isCounselor =
    normalizedRole.includes('counselor') ||
    normalizedRole.includes('guidance') ||
    role === 'مرشد' ||
    role === 'موجه' ||
    role === 'المرشد الطلابي';
  const isVicePrincipal =
    normalizedRole.includes('vice') ||
    normalizedRole.includes('assistant') ||
    role === 'وكيل' ||
    role === 'وكيلة' ||
    role === 'وكيل المدرسة';
  const isManagement =
    isOwner ||
    isVicePrincipal ||
    normalizedRole.includes('admin') ||
    normalizedRole.includes('principal') ||
    normalizedRole.includes('manager');

  const userRoleDisplay = useMemo(() => {
    if (user?.role_title) return user.role_title;
    if (user?.role_name) return user.role_name;
    if (isVicePrincipal) return isRTL ? 'وكيل المدرسة' : 'Vice Principal';
    if (isCounselor) return isRTL ? 'المرشد الطلابي' : 'Student Counselor';
    if (isTeacher) return isRTL ? 'معلم' : 'Teacher';
    return isRTL ? 'مدير المدرسة' : 'School Principal';
  }, [user, isVicePrincipal, isCounselor, isTeacher, isRTL]);

  const userNameDisplay = useMemo(() => {
    return user?.name || (isVicePrincipal ? (isRTL ? 'فهد عبدالعزيز السالم' : 'Fahad Abdulaziz Al-Salem') : isCounselor ? (isRTL ? 'سعد إبراهيم الناصر' : 'Saad Ibrahim Al-Nasser') : isTeacher ? (isRTL ? 'معلم' : 'Teacher') : (isRTL ? 'فهد عبدالعزيز السالم' : 'Fahad Abdulaziz Al-Salem'));
  }, [user, isVicePrincipal, isCounselor, isTeacher, isRTL]);

  // Navigation sections adapted for Counselor vs Teacher vs Manager/Admin
  const navSections: NavSection[] = useMemo(() => {
    if (isCounselor) {
      return [
        {
          id: 'students',
          labelAr: 'الطلاب',
          labelEn: 'Students',
          icon: 'users',
          items: [
            {
              id: 'students_list',
              labelAr: 'الطلاب',
              labelEn: 'Students',
              route: '/students',
              screenName: 'Students',
              icon: 'users',
            },
            {
              id: 'attendance',
              labelAr: 'الحضور',
              labelEn: 'Attendance',
              route: '/attendance/quick-mark',
              screenName: 'Attendance',
              params: { mode: 'quick-mark' },
              icon: 'checkCircle',
              badge: (b) => b?.attendance_today ?? 24,
            },
            {
              id: 'behavior',
              labelAr: 'السلوك',
              labelEn: 'Behavior',
              route: '/behavior',
              screenName: 'Behavior',
              icon: 'alertTriangle',
              badge: (b) => b?.behavior_open ?? 5,
            },
            {
              id: 'at_risk',
              labelAr: 'في الخطر',
              labelEn: 'At Risk',
              route: '/atrisk',
              screenName: 'AtRisk',
              icon: 'alertTriangle',
              badge: (b) => b?.atrisk ?? 21,
            },
          ],
        },
        {
          id: 'comm',
          labelAr: 'التواصل',
          labelEn: 'Communication',
          icon: 'message',
          items: [
            {
              id: 'summons',
              labelAr: 'الاستدعاءات',
              labelEn: 'Summons',
              route: '/summons',
              screenName: 'Summons',
              icon: 'phone',
            },
            {
              id: 'forms',
              labelAr: 'الاستبيانات والنماذج',
              labelEn: 'Surveys & Forms',
              route: '/forms',
              screenName: 'Integrations',
              icon: 'fileText',
            },
            {
              id: 'reports',
              labelAr: 'التقارير',
              labelEn: 'Reports',
              route: '/reports',
              screenName: 'Reports',
              icon: 'fileText',
            },
          ],
        },
      ];
    }

    if (isTeacher) {
      return [
        {
          id: 'classroom',
          labelAr: 'الفصل',
          labelEn: 'Classroom',
          icon: 'school',
          items: [
            {
              id: 'attendance',
              labelAr: 'الحضور اليومي',
              labelEn: 'Daily Attendance',
              route: '/attendance/quick-mark',
              screenName: 'Attendance',
              params: { mode: 'quick-mark' },
              icon: 'clipboard',
              badge: (b) => b?.attendance_today ?? 24,
            },
            {
              id: 'students_list',
              labelAr: 'طلابي',
              labelEn: 'My Students',
              route: '/students',
              screenName: 'Students',
              icon: 'users',
            },
            {
              id: 'homework',
              labelAr: 'الواجبات',
              labelEn: 'Homework',
              route: '/homework',
              screenName: 'Homework',
              icon: 'edit',
            },
          ],
        },
        {
          id: 'timetable',
          labelAr: 'جدول',
          labelEn: 'Timetable',
          icon: 'calendar',
          items: [
            {
              id: 'schedule',
              labelAr: 'جدولي الدراسي',
              labelEn: 'My Schedule',
              route: '/schedule',
              screenName: 'Schedule',
              icon: 'calendar',
            },
            {
              id: 'portfolios',
              labelAr: 'ملف إنجازي',
              labelEn: 'My Portfolio',
              route: '/portfolio',
              screenName: 'Portfolio',
              icon: 'award',
            },
          ],
        },
        {
          id: 'standalone',
          labelAr: 'أخرى',
          labelEn: 'Other',
          icon: 'grid',
          items: [
            {
              id: 'committees',
              labelAr: 'لجان وكنترول',
              labelEn: 'Committees',
              route: '/committees',
              screenName: 'Committees',
              icon: 'shield',
            },
            {
              id: 'tasks',
              labelAr: 'المهام',
              labelEn: 'Tasks',
              route: '/tasks',
              screenName: 'Tasks',
              badge: (b) => b?.tasks ?? 1,
              icon: 'check',
            },
          ],
        },
      ];
    }

    return [
      {
        id: 'students',
        labelAr: 'الطلاب',
        labelEn: 'Students',
        icon: 'users',
        badge: (b) => b?.students_count ?? 50,
        permission: 'employees.view',
        items: [
          {
            id: 'students_list',
            labelAr: 'الطلاب',
            labelEn: 'Students',
            route: '/students',
            screenName: 'Students',
            icon: 'users',
            permission: 'employees.view',
          },
          {
            id: 'classes',
            labelAr: 'الفصول',
            labelEn: 'Classes',
            route: '/groups',
            screenName: 'Students',
            params: { mode: 'groups' },
            icon: 'school',
            permission: 'employees.view',
          },
          {
            id: 'attendance',
            labelAr: 'الحضور',
            labelEn: 'Attendance',
            route: '/attendance/quick-mark',
            screenName: 'Attendance',
            params: { mode: 'quick-mark' },
            icon: 'clipboard',
            badge: (b) => b?.attendance_today ?? 24,
            permission: 'attendance.students.view',
          },
          {
            id: 'behavior',
            labelAr: 'السلوك',
            labelEn: 'Behavior',
            route: '/behavior',
            screenName: 'Behavior',
            icon: 'shield',
            badge: (b) => b?.behavior_open ?? 5,
            permission: 'behavior.view',
          },
          {
            id: 'at_risk',
            labelAr: 'في الخطر',
            labelEn: 'At Risk',
            route: '/atrisk',
            screenName: 'AtRisk',
            icon: 'alertTriangle',
            badge: (b) => b?.atrisk ?? 19,
            permission: 'at_risk.view',
          },
        ],
      },
      {
        id: 'finance',
        labelAr: 'المالية',
        labelEn: 'Finance',
        icon: 'creditCard',
        permission: 'finance.reports.view',
        items: [
          {
            id: 'financial_overview',
            labelAr: 'نظرة عامة المالية',
            labelEn: 'Financial Overview',
            route: '/finance',
            screenName: 'Finance',
            params: { tab: 'invoices' },
            icon: 'chart',
            permission: 'finance.reports.view',
          },
          {
            id: 'fee_setup',
            labelAr: 'إعداد الرسوم',
            labelEn: 'Fee Setup',
            route: '/finance/fee-types',
            screenName: 'Finance',
            params: { tab: 'gateways' },
            icon: 'settings',
            badge: 4,
            permission: 'finance.fee_types.view',
          },
          {
            id: 'invoices_collections',
            labelAr: 'الفواتير والتحصيل',
            labelEn: 'Invoices & Collections',
            route: '/finance/invoices',
            screenName: 'Finance',
            params: { tab: 'invoices' },
            icon: 'fileText',
            badge: 6,
            permission: 'finance.payment_status.view',
          },
          {
            id: 'payments',
            labelAr: 'المدفوعات',
            labelEn: 'Payments',
            route: '/finance/payments',
            screenName: 'Finance',
            params: { tab: 'pay_links' },
            icon: 'creditCard',
            badge: 5,
            permission: 'finance.payment_status.view',
          },
          {
            id: 'requests_approvals',
            labelAr: 'طلبات الاعتماد',
            labelEn: 'Requests & Approvals',
            route: '/finance/requests',
            screenName: 'Finance',
            params: { tab: 'bank_transfer' },
            icon: 'check',
            badge: 2,
            permission: 'finance.discount.request.view',
          },
          {
            id: 'financial_reports',
            labelAr: 'التقارير المالية',
            labelEn: 'Financial Reports',
            route: '/finance/reports',
            screenName: 'Finance',
            params: { tab: 'invoices' },
            icon: 'chart',
            permission: 'finance.reports.view',
          },
        ],
      },
      {
        id: 'academic',
        labelAr: 'الأكاديمي',
        labelEn: 'Academic',
        icon: 'fileText',
        permission: 'schedule.view',
        items: [
          {
            id: 'subjects',
            labelAr: 'المواد الدراسية',
            labelEn: 'Subjects',
            route: '/academic?tab=subjects',
            screenName: 'Schedule',
            params: { tab: 'subjects' },
            icon: 'fileText',
            permission: 'schedule.view',
          },
          {
            id: 'schedule',
            labelAr: 'الجدول الدراسي',
            labelEn: 'Class Schedule',
            route: '/schedule',
            screenName: 'Schedule',
            icon: 'calendar',
            permission: 'schedule.view',
          },
          {
            id: 'homework',
            labelAr: 'الواجبات المدرسية',
            labelEn: 'Homework',
            route: '/homework',
            screenName: 'Homework',
            icon: 'edit',
            permission: 'homework.assignment.view',
          },
          {
            id: 'exam_dist',
            labelAr: 'توزيع الاختبارات',
            labelEn: 'Exam Distribution',
            route: '/examdist',
            screenName: 'ExamDistribution',
            icon: 'grid',
            permission: 'exams.view',
          },
          {
            id: 'seat_nums',
            labelAr: 'أرقام الجلوس',
            labelEn: 'Seat Numbers',
            route: '/seatnums',
            screenName: 'ExamDistribution',
            params: { tab: 'seats' },
            icon: 'users',
            permission: 'exams.view',
          },
          {
            id: 'committees',
            labelAr: 'اللجان المدرسية',
            labelEn: 'Committees',
            route: '/committees',
            screenName: 'Committees',
            icon: 'users',
            permission: 'committees.view',
          },
        ],
      },
      {
        id: 'staff',
        labelAr: 'الكادر',
        labelEn: 'Staff',
        icon: 'staff',
        permission: 'hr.employee.profile.view',
        items: [
          {
            id: 'teaching_staff',
            labelAr: 'الكادر التعليمي',
            labelEn: 'Teaching Staff',
            route: '/staff',
            screenName: 'HR',
            icon: 'staff',
            permission: 'hr.employee.profile.view',
          },
          {
            id: 'staff_attendance',
            labelAr: 'حضور الموظفين',
            labelEn: 'Staff Attendance',
            route: '/staff/attendance',
            screenName: 'HR',
            params: { tab: 'attendance' },
            icon: 'clock',
            permission: 'hr.attendance.view',
          },
          {
            id: 'leave_approvals',
            labelAr: 'طلبات الإجازات',
            labelEn: 'Leave Approvals',
            route: '/staff/leaves/approvals',
            screenName: 'HR',
            params: { tab: 'leaves' },
            icon: 'clipboard',
            permission: 'hr.leave.decide.view',
          },
          {
            id: 'substitutions',
            labelAr: 'حصص الانتظار والبديل',
            labelEn: 'Class Substitutions',
            route: '/staff/substitutions',
            screenName: 'HR',
            params: { tab: 'substitutions' },
            icon: 'refresh',
            permission: 'hr.leave.decide.view',
          },
          {
            id: 'expiry_alerts',
            labelAr: 'تنبيهات انتهاء الوثائق',
            labelEn: 'Document Expiry Alerts',
            route: '/staff/expiry-alerts',
            screenName: 'HR',
            params: { tab: 'expiry-alerts' },
            icon: 'alertTriangle',
            permission: 'hr.expiry_alerts.view',
          },
          {
            id: 'staff_reports',
            labelAr: 'تقارير الموظفين',
            labelEn: 'Staff Reports',
            route: '/staff/reports',
            screenName: 'Reports',
            params: { type: 'staff' },
            icon: 'chart',
            permission: 'hr.reports.view',
          },
          {
            id: 'portfolios',
            labelAr: 'ملفات الإنجاز',
            labelEn: 'Portfolios',
            route: '/portfolio',
            screenName: 'Portfolio',
            icon: 'award',
            permission: 'portfolio.view',
          },
        ],
      },
      {
        id: 'comm',
        labelAr: 'التواصل',
        labelEn: 'Communication',
        icon: 'message',
        permission: 'messages.view',
        items: [
          {
            id: 'messages',
            labelAr: 'الرسائل',
            labelEn: 'Messages',
            route: '/messages',
            screenName: 'Messages',
            icon: 'message',
            permission: 'messages.view',
          },
          {
            id: 'summons',
            labelAr: 'الاستدعاءات',
            labelEn: 'Summons',
            route: '/summons',
            screenName: 'Summons',
            icon: 'bell',
            permission: 'summons.view',
          },
          {
            id: 'forms',
            labelAr: 'النماذج والاستبيانات',
            labelEn: 'Surveys & Forms',
            route: '/forms',
            screenName: 'Integrations',
            icon: 'fileText',
            permission: 'forms.view',
          },
          {
            id: 'reports',
            labelAr: 'التقارير',
            labelEn: 'Reports',
            route: '/reports',
            screenName: 'Reports',
            icon: 'chart',
            permission: 'reports.view',
          },
        ],
      },
      ...(!isVicePrincipal && (isOwner || hasPermission('settings.manage'))
        ? [
            {
              id: 'settings',
              labelAr: 'الإعدادات',
              labelEn: 'Settings',
              icon: 'settings' as IconName,
              permission: 'settings.manage',
              items: [
                {
                  id: 'roles',
                  labelAr: 'الأدوار',
                  labelEn: 'Roles',
                  route: '/access/roles',
                  screenName: 'Settings',
                  params: { section: 'roles' },
                  icon: 'shield' as IconName,
                  permission: 'sub_users.manage',
                },
                {
                  id: 'permission_matrix',
                  labelAr: 'مصفوفة الصلاحيات',
                  labelEn: 'Permission Matrix',
                  route: '/settings/permissions',
                  screenName: 'Settings',
                  params: { section: 'permissions' },
                  icon: 'grid' as IconName,
                  permission: 'permissions.matrix.manage',
                },
                {
                  id: 'school_settings',
                  labelAr: 'إعدادات المدرسة',
                  labelEn: 'School Settings',
                  route: '/settings',
                  screenName: 'Settings',
                  icon: 'settings' as IconName,
                  permission: 'settings.manage',
                },
                {
                  id: 'delivery_status',
                  labelAr: 'حالات التسليم',
                  labelEn: 'Notification Status',
                  route: '/settings/delivery-status',
                  screenName: 'Settings',
                  params: { section: 'delivery_status' },
                  icon: 'bell' as IconName,
                  permission: 'settings.manage',
                },
                {
                  id: 'audit_log',
                  labelAr: 'سجل العمليات',
                  labelEn: 'Audit Log',
                  route: '/settings/audit-log',
                  screenName: 'Settings',
                  params: { section: 'audit_log' },
                  icon: 'clock' as IconName,
                  permission: 'audit.view',
                },
              ],
            },
          ]
        : []),
    ];
  }, [isTeacher, isCounselor, isVicePrincipal, isOwner, hasPermission]);

  // Filter sections and items according to existing role & permission system
  const authorizedSections = useMemo(() => {
    return navSections
      .map((section) => {
        const filteredItems = section.items.filter((item) => {
          if (isVicePrincipal) {
            return section.id !== 'settings';
          }
          if (isOwner) return true;
          if (!item.permission) return true;
          return hasPermission(item.permission);
        });

        return {
          ...section,
          items: filteredItems,
        };
      })
      .filter((section) => {
        if (isVicePrincipal && section.id === 'settings') return false;
        if (isManagement) return section.items.length > 0;
        return section.items.length > 0;
      });
  }, [navSections, isManagement, isVicePrincipal, isOwner, hasPermission]);

  // User manual accordion toggle overrides
  const [userToggledSections, setUserToggledSections] = useState<Record<string, boolean>>({});

  // Determine active item and section
  const activeRouteName = route.name;
  const activeRouteParams = route.params as Record<string, any> | undefined;

  const isItemActive = useCallback(
    (item: NavChildItem) => {
      if (item.screenName !== activeRouteName) return false;

      if (item.params) {
        if (!activeRouteParams) return false;
        for (const [key, val] of Object.entries(item.params)) {
          if (activeRouteParams[key] !== val) {
            return false;
          }
        }
        return true;
      }

      if (activeRouteParams) {
        if (
          (activeRouteParams.tab && activeRouteParams.tab !== 'invoices' && item.screenName === 'Finance') ||
          (activeRouteParams.tab === 'subjects' && item.id === 'schedule') ||
          (activeRouteParams.tab === 'seats' && item.id === 'exam_dist') ||
          (activeRouteParams.mode === 'groups' && item.id === 'students_list') ||
          (activeRouteParams.section && item.id === 'school_settings')
        ) {
          return false;
        }
      }
      return true;
    },
    [activeRouteName, activeRouteParams]
  );

  // Derived active section ID based on current route
  const activeSectionId = useMemo(() => {
    for (const section of authorizedSections) {
      if (section.items.some((item) => isItemActive(item))) {
        return section.id;
      }
    }
    return 'students';
  }, [authorizedSections, isItemActive]);

  // Derived check for section expansion: manual override if toggled, otherwise active section / students
  const isSectionExpanded = useCallback(
    (sectionId: string) => {
      if (userToggledSections[sectionId] !== undefined) {
        return userToggledSections[sectionId];
      }
      return sectionId === activeSectionId || sectionId === 'students';
    },
    [userToggledSections, activeSectionId]
  );

  const toggleSection = (sectionId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setUserToggledSections((prev) => ({
      ...prev,
      [sectionId]: !isSectionExpanded(sectionId),
    }));
  };

  const { isNavigating, targetScreen, startNavigation, finishNavigation } = useNavigationLoading();

  const handleNavigate = (item: NavChildItem) => {
    if (!isDesktop) {
      handleCloseMobileDrawer();
    } else {
      setMobileSidebarOpen(false);
    }
    startNavigation(item.screenName);

    // Tab screens live inside MainTabs – navigate via parent to avoid "not handled" warning
    const TAB_SCREENS = ['Dashboard', 'Students', 'Attendance', 'Tasks'];
    if (TAB_SCREENS.includes(item.screenName)) {
      navigation.navigate('MainTabs', {
        screen: item.screenName,
        params: item.params,
      });
    } else {
      navigation.navigate(item.screenName, item.params);
    }

    setTimeout(() => {
      finishNavigation();
    }, 450);
  };

  const toggleLanguage = () => {
    toggleLang();
  };

  const handleLogout = async () => {
    await logout();
  };

  const resolveBadgeCount = (item: NavChildItem): string | number | undefined => {
    if (!item.badge) return undefined;
    if (typeof item.badge === 'function') {
      return item.badge(badges);
    }
    return item.badge;
  };

  const resolveSectionBadge = (section: NavSection): string | number | undefined => {
    if (!section.badge) return undefined;
    if (typeof section.badge === 'function') {
      return section.badge(badges);
    }
    return section.badge;
  };

  const isDashboardActive = activeRouteName === 'Dashboard';

  const renderSidebarContent = () => (
    <View style={[styles.sidebarContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      {/* 1. School/Brand Header */}
      <View style={[styles.brandHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.brandLeadingGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.brandIconBox}>
            <Image
              source={school?.logo_url ? { uri: school.logo_url } : require('../../../assets/logo.png')}
              style={styles.brandLogoImage}
              resizeMode="contain"
            />
          </View>
          <View style={[styles.brandTextGroup, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <View style={[styles.brandTitleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <AppText variant="cardTitle" weight="bold" color="#FFFFFF" style={styles.brandTitleWhite}>
                school
              </AppText>
              <AppText variant="cardTitle" weight="bold" color="#38BDF8" style={styles.brandTitleBlue}>
                Bit
              </AppText>
            </View>
            <AppText variant="caption" color="#8EA2C6" style={styles.brandSubtitle} numberOfLines={1}>
              {userNameDisplay}
            </AppText>
          </View>
        </View>

        {!isDesktop && (
          <TouchableOpacity
            style={styles.drawerCloseBtn}
            onPress={handleCloseMobileDrawer}
            accessibilityRole="button"
            accessibilityLabel="Close navigation"
          >
            <Icon name="close" size={18} color="#8EA2C6" />
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Current User Profile Card */}
      <View style={styles.profileCard}>
        <View style={[styles.profileCardInner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.avatarBoxBlue}>
            <Icon name="clipboard" size={20} color="#FFFFFF" />
          </View>
          <View style={[styles.profileTextCol, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <AppText variant="captionBold" color="#FFFFFF" style={styles.profileNameText} numberOfLines={1}>
              {userNameDisplay}
            </AppText>
            <View style={[styles.rolePillRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.roleBadgePill, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Icon name="clipboard" size={11} color="#FFFFFF" />
                <AppText variant="caption" color="#FFFFFF" style={styles.roleBadgeText}>
                  {userRoleDisplay}
                </AppText>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 3. Navigation ScrollView */}
      <ScrollView style={styles.navScrollView} showsVerticalScrollIndicator={false}>
        {/* Top Standalone Main Item: Dashboard (لوحة التحكم) */}
        <TouchableOpacity
          style={[
            styles.dashboardBtn,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
            isDashboardActive && styles.dashboardBtnActive,
          ]}
          onPress={() => {
            handleNavigate({
              id: 'dashboard',
              labelAr: 'لوحة التحكم',
              labelEn: 'Dashboard',
              route: '/dashboard',
              icon: 'grid',
              screenName: 'Dashboard',
            });
          }}
          accessibilityRole="button"
          accessibilityLabel={isRTL ? 'لوحة التحكم' : 'Dashboard'}
        >
          <View style={[styles.dashboardLeading, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Icon
              name="grid"
              size={18}
              color={isDashboardActive ? '#FFFFFF' : '#8EA2C6'}
            />
            <AppText
              variant="bodyBold"
              color={isDashboardActive ? '#FFFFFF' : '#D1D9E7'}
              style={styles.dashboardText}
            >
              {isRTL ? 'لوحة التحكم' : 'Dashboard'}
            </AppText>
          </View>
        </TouchableOpacity>

        {/* Collapsible Navigation Groups & Subitems */}
        {authorizedSections.map((section) => {
          const isExpanded = isSectionExpanded(section.id);
          const sectionBadge = resolveSectionBadge(section);

          return (
            <View key={section.id} style={styles.sectionContainer}>
              {/* Accordion Section Header */}
              <TouchableOpacity
                style={[
                  styles.sectionHeaderBtn,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                ]}
                onPress={() => toggleSection(section.id)}
                accessibilityRole="button"
                accessibilityLabel={isRTL ? section.labelAr : section.labelEn}
              >
                <View style={[styles.sectionHeaderLeading, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Icon
                    name={section.icon}
                    size={18}
                    color="#FFFFFF"
                  />
                  <AppText
                    variant="bodyBold"
                    color="#FFFFFF"
                    style={styles.sectionHeaderText}
                  >
                    {isRTL ? section.labelAr : section.labelEn}
                  </AppText>
                </View>

                <View style={[styles.sectionHeaderTrailing, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  {sectionBadge !== undefined && (
                    <View style={styles.sectionBadgePill}>
                      <AppText variant="caption" color="#CBD5E1" style={styles.sectionBadgeText}>
                        {String(sectionBadge)}
                      </AppText>
                    </View>
                  )}
                  <Icon
                    name={isExpanded ? 'chevronDown' : 'chevronRight'}
                    style={!isExpanded ? { transform: [{ scaleX: isRTL ? -1 : 1 }] } : undefined}
                    size={14}
                    color="#8EA2C6"
                  />
                </View>
              </TouchableOpacity>

              {/* Collapsible Children Subitems */}
              {isExpanded && (
                <View
                  style={[
                    styles.subitemsList,
                    isRTL ? styles.subitemsListRTL : styles.subitemsListLTR,
                  ]}
                >
                  {section.items.map((item) => {
                    const active = isItemActive(item);
                    const badgeVal = resolveBadgeCount(item);

                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.subItemBtn,
                          { flexDirection: isRTL ? 'row-reverse' : 'row' },
                          active && styles.subItemBtnActive,
                        ]}
                        onPress={() => handleNavigate(item)}
                        accessibilityRole="button"
                        accessibilityLabel={isRTL ? item.labelAr : item.labelEn}
                      >
                        <View style={[styles.subItemLeading, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                          <Icon
                            name={item.icon}
                            size={16}
                            color={active ? '#FFFFFF' : '#8EA2C6'}
                          />
                          <AppText
                            variant="captionBold"
                            color={active ? '#FFFFFF' : '#8EA2C6'}
                            style={[styles.subItemText, active ? styles.subItemTextActive : undefined]}
                          >
                            {isRTL ? item.labelAr : item.labelEn}
                          </AppText>
                        </View>

                        {/* Dynamic Count Badge */}
                        {badgeVal !== undefined && (
                          <View style={styles.badgePillCircle}>
                            <AppText
                              variant="caption"
                              color="#FFFFFF"
                              style={styles.badgePillTextCircle}
                            >
                              {String(badgeVal)}
                            </AppText>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* 4. Bottom Actions: Language Toggle, Theme Toggle & Logout */}
      <View style={[styles.sidebarFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity
          style={[styles.logoutBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          onPress={handleLogout}
          accessibilityRole="button"
        >
          <Icon name="logOut" size={14} color="#F43F5E" />
          <AppText variant="captionBold" color="#F43F5E" style={styles.logoutText}>
            {isRTL ? 'خروج' : 'Logout'}
          </AppText>
        </TouchableOpacity>

        <View style={[styles.footerUtilsGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            style={styles.langBtn}
            onPress={toggleLanguage}
            accessibilityRole="button"
          >
            <AppText variant="captionBold" color="#CBD5E1" style={styles.langBtnText}>
              {lang === 'ar' ? 'EN' : 'العربية'}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.themeBtn}
            onPress={toggleTheme}
            accessibilityRole="button"
            accessibilityLabel="Toggle Theme"
          >
            <Icon name={isDark ? 'sun' : 'moon'} size={15} color="#CBD5E1" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const calculatedUnread = unreadCount ?? badges?.messages_unread ?? 29;
  const sheetWidth = Math.min(320, width * 0.85);

  return (
    <View
      style={[
        styles.masterWrapper,
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
        isDark && styles.darkMasterWrapper,
      ]}
    >
      {/* Desktop / Persistent Sidebar */}
      {isDesktop && (
        <View
          style={[
            styles.desktopSidebarWrapper,
            isRTL ? styles.sidebarBorderLeft : styles.sidebarBorderRight,
          ]}
        >
          {renderSidebarContent()}
        </View>
      )}

      {/* Mobile Drawer Modal */}
      {!isDesktop && (
        <Modal
          visible={mobileSidebarOpen}
          transparent
          animationType="none"
          onRequestClose={handleCloseMobileDrawer}
        >
          <View style={styles.mobileOverlay}>
            <Animated.View
              style={[
                styles.mobileBackdrop,
                { opacity: slideAnim },
              ]}
            >
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={handleCloseMobileDrawer}
              />
            </Animated.View>
            <Animated.View
              {...drawerPanResponder.panHandlers}
              style={[
                styles.mobileSidebarSheet,
                {
                  width: sheetWidth,
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [drawerPosition === 'right' ? sheetWidth : -sheetWidth, 0],
                      }),
                    },
                  ],
                },
                drawerPosition === 'right'
                  ? (I18nManager.isRTL ? styles.sheetLeft : styles.sheetRight)
                  : (I18nManager.isRTL ? styles.sheetRight : styles.sheetLeft),
              ]}
            >
              {renderSidebarContent()}
            </Animated.View>
          </View>
        </Modal>
      )}

      {/* Main Content Area */}
      <View style={styles.mainContentArea} {...edgePanResponder.panHandlers}>
        {/* Top Navbar Header */}
        <View
          style={[
            styles.topHeader,
            { paddingTop: Math.max(insets.top, 10), flexDirection: isRTL ? 'row-reverse' : 'row' },
            isDark && styles.darkTopHeader,
          ]}
        >
          {/* Mobile Hamburger Menu Toggle on leading side */}
          {!isDesktop && (
            <TouchableOpacity
              style={[styles.hamburgerBtn, isDark && styles.darkNotifButton]}
              onPress={handleOpenMobileDrawer}
              accessibilityRole="button"
              accessibilityLabel="Open Navigation Menu"
            >
              <Icon name="menu" size={20} color={isDark ? '#F8FAFC' : '#0A1D3D'} />
            </TouchableOpacity>
          )}

          <View style={[styles.headerTitleCol, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <AppText variant="cardTitle" weight="bold" style={[styles.pageTitle, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
              {title || (isRTL ? 'لوحة التحكم' : 'Dashboard')}
            </AppText>
            {subtitle && (
              <AppText variant="caption" color={isDark ? '#94A3B8' : '#64748B'} style={{ textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
                {subtitle}
              </AppText>
            )}
          </View>

          <View style={[styles.headerActionGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {/* Notification Bell with Badge Counter */}
            <TouchableOpacity
              style={[styles.notifButton, isDark && styles.darkNotifButton]}
              onPress={onOpenNotifications || (() => navigation.navigate('Messages'))}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <Icon name="bell" size={18} color={isDark ? '#F8FAFC' : '#0A1D3D'} />
              {calculatedUnread > 0 && (
                <View style={[styles.notifBadge, isRTL ? { left: -2 } : { right: -2 }]}>
                  <AppText variant="caption" color="#FFFFFF" style={styles.notifBadgeText}>
                    {calculatedUnread > 99 ? '99+' : String(calculatedUnread)}
                  </AppText>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Screen Body */}
        <View style={styles.contentBody}>
          {isNavigating ? (
            <PageSkeletonSelector routeName={targetScreen || route.name} />
          ) : (
            children
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  masterWrapper: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
  },
  darkMasterWrapper: {
    backgroundColor: '#07132B',
  },
  ltrLayout: {
    flexDirection: 'row',
  },
  desktopSidebarWrapper: {
    width: 270,
    backgroundColor: '#071228',
    height: '100%',
  },
  sidebarBorderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: '#13254C',
  },
  sidebarBorderRight: {
    borderRightWidth: 1,
    borderRightColor: '#13254C',
  },
  sidebarContainer: {
    flex: 1,
    backgroundColor: '#071228',
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'android' ? 24 : 16,
    justifyContent: 'space-between',
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#13254C',
  },
  brandLeadingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  brandIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#122850',
    borderWidth: 1,
    borderColor: '#1D3B7A',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  brandLogoImage: {
    width: 28,
    height: 28,
  },
  brandTextGroup: {
    flex: 1,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  brandTitleWhite: {
    fontSize: 16,
    fontFamily: ibmPlexArabicFontFamily.bold,
  },
  brandTitleBlue: {
    fontSize: 16,
    fontFamily: ibmPlexArabicFontFamily.bold,
  },
  brandSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  drawerCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F1A3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    backgroundColor: '#0A192F',
    borderRadius: 12,
    padding: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#152C53',
  },
  profileCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarBoxBlue: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#1D4ED8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileTextCol: {
    flex: 1,
  },
  profileNameText: {
    fontSize: 14,
    fontFamily: ibmPlexArabicFontFamily.bold,
    fontWeight: 'bold',
  },
  rolePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  roleBadgePill: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    alignItems: 'center',
    gap: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontFamily: ibmPlexArabicFontFamily.medium,
  },
  navScrollView: {
    flex: 1,
    marginVertical: 4,
  },
  dashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 46,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  dashboardBtnActive: {
    backgroundColor: '#1D4ED8',
  },
  dashboardLeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dashboardText: {
    fontSize: 14,
    fontFamily: ibmPlexArabicFontFamily.bold,
    fontWeight: 'bold',
  },
  sectionContainer: {
    marginBottom: 6,
  },
  sectionHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    minHeight: 44,
    borderRadius: 8,
  },
  sectionHeaderLeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sectionHeaderText: {
    fontSize: 14.5,
    fontFamily: ibmPlexArabicFontFamily.bold,
    fontWeight: 'bold',
  },
  sectionHeaderTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionBadgePill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  subitemsList: {
    paddingVertical: 2,
    gap: 2,
  },
  subitemsListRTL: { paddingStart: 20, paddingEnd: 4 },
  subitemsListLTR: { paddingStart: 20, paddingEnd: 4 },
  subItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 12,
    minHeight: 40,
    borderRadius: 8,
  },
  subItemBtnActive: {
    backgroundColor: '#1D4ED8',
  },
  subItemLeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  subItemText: {
    fontSize: 13.5,
    fontFamily: ibmPlexArabicFontFamily.medium,
  },
  subItemTextActive: {
    fontFamily: ibmPlexArabicFontFamily.bold,
    fontWeight: 'bold',
  },
  badgePillCircle: {
    backgroundColor: '#D97706',
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgePillTextCircle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sidebarFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#132147',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2D0B2E',
    borderWidth: 1,
    borderColor: '#831843',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    minHeight: 36,
  },
  logoutText: {
    fontSize: 12.5,
    fontFamily: ibmPlexArabicFontFamily.medium,
  },
  footerUtilsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langBtn: {
    backgroundColor: '#112240',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E3A6E',
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  langBtnText: {
    fontSize: 12,
    fontFamily: ibmPlexArabicFontFamily.bold,
  },
  themeBtn: {
    backgroundColor: '#112240',
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E3A6E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContentArea: {
    flex: 1,
    height: '100%',
  },
  topHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  darkTopHeader: {
    backgroundColor: '#0F244A',
    borderBottomColor: '#1E3A6E',
  },
  headerTitleCol: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 21,
    fontFamily: ibmPlexArabicFontFamily.bold,
    fontWeight: 'bold',
  },
  headerActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notifButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  darkNotifButton: {
    backgroundColor: '#1E3A6E',
    borderColor: '#2D4E8A',
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    backgroundColor: '#E11D48',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  hamburgerBtn: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contentBody: {
    flex: 1,
  },
  mobileOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  mobileBackdrop: {
    flex: 1,
  },
  mobileSidebarSheet: {
    height: '100%',
    position: 'absolute',
    top: 0,
    bottom: 0,
    zIndex: 100,
    backgroundColor: '#081028',
    elevation: 24,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  sheetRight: {
    right: 0,
  },
  sheetLeft: {
    left: 0,
  },
  alignStart: {
    alignItems: 'flex-start',
  },
});

export default WebDashboardLayout;
