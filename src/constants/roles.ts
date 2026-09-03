export type UserRole =
  | 'super_admin'
  | 'school_admin'
  | 'principal'
  | 'vice_principal'
  | 'teacher'
  | 'supervisor'
  | 'counselor'
  | 'staff'
  | 'parent'
  | 'student'
  | 'driver';

export interface RoleInfo {
  key: UserRole;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  badgeColor: string;
  category: 'management' | 'educational' | 'administrative' | 'support' | 'client';
}

export const USER_ROLES: Record<UserRole, RoleInfo> = {
  super_admin: {
    key: 'super_admin',
    nameAr: 'مدير عام النظام',
    nameEn: 'Super Administrator',
    descriptionAr: 'صلاحيات كاملة لإدارة المنصة وجميع المدارس',
    descriptionEn: 'Full privileges across the platform and all schools',
    badgeColor: '#0A1D3D',
    category: 'management',
  },
  school_admin: {
    key: 'school_admin',
    nameAr: 'مدير المدرسة',
    nameEn: 'School Administrator',
    descriptionAr: 'إدارة المدرسة، الكادر، والعمليات التعليمية والإدارية',
    descriptionEn: 'Manages school operations, staff, and settings',
    badgeColor: '#1246B7',
    category: 'management',
  },
  principal: {
    key: 'principal',
    nameAr: 'قائد المدرسة',
    nameEn: 'School Principal',
    descriptionAr: 'القيادة التربوية والتعليمية للمدرسة',
    descriptionEn: 'Educational and pedagogical leadership',
    badgeColor: '#1246B7',
    category: 'management',
  },
  vice_principal: {
    key: 'vice_principal',
    nameAr: 'وكيل المدرسة',
    nameEn: 'Vice Principal',
    descriptionAr: 'متابعة شؤون الطلاب، المعلمين، والشؤون المدرسية',
    descriptionEn: 'Student, teacher, and school affairs management',
    badgeColor: '#1E88FF',
    category: 'management',
  },
  teacher: {
    key: 'teacher',
    nameAr: 'معلم',
    nameEn: 'Teacher',
    descriptionAr: 'إدارة الحصص، التحضير، الدرجات، والحضور الصفي',
    descriptionEn: 'Class management, attendance, grades, and teaching',
    badgeColor: '#0B7A55',
    category: 'educational',
  },
  supervisor: {
    key: 'supervisor',
    nameAr: 'مشرف تربوي',
    nameEn: 'Educational Supervisor',
    descriptionAr: 'الإشراف على الخطط الدراسية والأداء التعليمي',
    descriptionEn: 'Academic supervision and curriculum planning',
    badgeColor: '#5A6784',
    category: 'educational',
  },
  counselor: {
    key: 'counselor',
    nameAr: 'موجه طلابي / مرشد',
    nameEn: 'Student Counselor',
    descriptionAr: 'متابعة السلوك، الإرشاد الطلابي، والرعاية الاجتماعية',
    descriptionEn: 'Student guidance, behavioral, and psychological support',
    badgeColor: '#E91E8E',
    category: 'educational',
  },
  staff: {
    key: 'staff',
    nameAr: 'كادر إداري',
    nameEn: 'Administrative Staff',
    descriptionAr: 'المهام الإدارية، التسجيل، وشؤون الموظفين',
    descriptionEn: 'Administrative, clerical, and operational duties',
    badgeColor: '#77839B',
    category: 'administrative',
  },
  parent: {
    key: 'parent',
    nameAr: 'ولي أمر',
    nameEn: 'Parent / Guardian',
    descriptionAr: 'متابعة حضور ودرجات ومستجدات الأبناء',
    descriptionEn: 'Monitors student progress, attendance, and updates',
    badgeColor: '#FF8A00',
    category: 'client',
  },
  student: {
    key: 'student',
    nameAr: 'طالب / طالبة',
    nameEn: 'Student',
    descriptionAr: 'الاطلاع على الجدول، الواجبات، والحضور والدرجات',
    descriptionEn: 'Views schedules, assignments, attendance, and grades',
    badgeColor: '#6EC5FF',
    category: 'client',
  },
  driver: {
    key: 'driver',
    nameAr: 'سائق نقل مدرسي',
    nameEn: 'Bus Driver',
    descriptionAr: 'إدارة خطوط النقل وحضور وانصراف الطلاب في الحافلة',
    descriptionEn: 'School transport routes and student bus attendance',
    badgeColor: '#FF8A00',
    category: 'support',
  },
};

export interface RepresentativeTitle {
  id: string;
  titleAr: string;
  titleEn: string;
  category: 'leadership' | 'educational' | 'support' | 'counseling';
}

/**
 * Official representative and functional job titles in Saudi schools
 */
export const REPRESENTATIVE_TITLES: RepresentativeTitle[] = [
  {
    id: 'general_manager',
    titleAr: 'مدير عام',
    titleEn: 'General Manager',
    category: 'leadership',
  },
  {
    id: 'school_principal',
    titleAr: 'قائد المدرسة / مدير المدرسة',
    titleEn: 'School Principal',
    category: 'leadership',
  },
  {
    id: 'vice_principal_academic',
    titleAr: 'وكيل الشؤون التعليمية',
    titleEn: 'Vice Principal for Academic Affairs',
    category: 'leadership',
  },
  {
    id: 'vice_principal_students',
    titleAr: 'وكيل شؤون الطلاب',
    titleEn: 'Vice Principal for Student Affairs',
    category: 'leadership',
  },
  {
    id: 'vice_principal_school',
    titleAr: 'وكيل الشؤون المدرسية',
    titleEn: 'Vice Principal for School Affairs',
    category: 'leadership',
  },
  {
    id: 'student_counselor',
    titleAr: 'موجه طلابي (مرشد طلابي)',
    titleEn: 'Student Counselor',
    category: 'counseling',
  },
  {
    id: 'activity_leader',
    titleAr: 'رائد نشاط',
    titleEn: 'Student Activity Coordinator',
    category: 'educational',
  },
  {
    id: 'learning_resources_specialist',
    titleAr: 'أمين مصادر التعلم',
    titleEn: 'Learning Resources Specialist',
    category: 'educational',
  },
  {
    id: 'lab_technician',
    titleAr: 'محضر مختبر علوم',
    titleEn: 'Science Laboratory Specialist',
    category: 'support',
  },
  {
    id: 'gifted_coordinator',
    titleAr: 'منسق رعاية الموهوبين',
    titleEn: 'Gifted Students Coordinator',
    category: 'educational',
  },
  {
    id: 'safety_officer',
    titleAr: 'مسؤول الأمن والسلامة',
    titleEn: 'Safety and Security Coordinator',
    category: 'support',
  },
  {
    id: 'senior_teacher',
    titleAr: 'معلم أول',
    titleEn: 'Senior Teacher',
    category: 'educational',
  },
  {
    id: 'teacher',
    titleAr: 'معلم مادة',
    titleEn: 'Subject Teacher',
    category: 'educational',
  },
  {
    id: 'special_education_teacher',
    titleAr: 'معلم تربية خاصة',
    titleEn: 'Special Education Teacher',
    category: 'educational',
  },
  {
    id: 'administrative_assistant',
    titleAr: 'مساعد إداري / كاتب',
    titleEn: 'Administrative Assistant',
    category: 'support',
  },
  {
    id: 'registrar',
    titleAr: 'مسؤول القبول والتسجيل',
    titleEn: 'Admissions & Registrar Officer',
    category: 'support',
  },
  {
    id: 'accountant',
    titleAr: 'محاسب مالي',
    titleEn: 'Financial Accountant',
    category: 'support',
  },
  {
    id: 'it_technician',
    titleAr: 'أخصائي تقنية معلومات',
    titleEn: 'IT Specialist',
    category: 'support',
  },
  {
    id: 'health_guide',
    titleAr: 'مرشد صحي',
    titleEn: 'School Health Guide',
    category: 'support',
  },
  {
    id: 'security_guard',
    titleAr: 'حارس أمن',
    titleEn: 'Security Guard',
    category: 'support',
  },
  {
    id: 'bus_driver',
    titleAr: 'سائق حافلة مدرسية',
    titleEn: 'School Bus Driver',
    category: 'support',
  },
];

/**
 * Get display name for a role in requested language ('ar' or 'en')
 */
export function getRoleDisplayName(role: UserRole, lang: 'ar' | 'en' = 'ar'): string {
  const info = USER_ROLES[role];
  if (!info) return role;
  return lang === 'ar' ? info.nameAr : info.nameEn;
}

/**
 * Helper to check administrative privilege
 */
export function isAdministrativeRole(role: UserRole): boolean {
  return (
    role === 'super_admin' ||
    role === 'school_admin' ||
    role === 'principal' ||
    role === 'vice_principal'
  );
}

/**
 * Helper to check teaching role
 */
export function isTeachingRole(role: UserRole): boolean {
  return role === 'teacher' || role === 'supervisor';
}
