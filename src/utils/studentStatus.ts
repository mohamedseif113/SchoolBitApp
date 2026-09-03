import { colors } from '../theme/colors';

export function getStudentStatusLabel(status?: string, lang: string = 'ar'): string {
  if (!status) return lang === 'ar' ? 'منتظم' : 'Active';

  const normalized = status.toLowerCase().trim();

  switch (normalized) {
    case 'active':
    case 'regular':
    case 'منتظم':
    case 'نشط':
      return lang === 'ar' ? 'منتظم' : 'Active';
    case 'absent':
    case 'غياب':
    case 'غياب بعذر':
      return lang === 'ar' ? 'غياب بعذر' : 'Absent';
    case 'suspended':
    case 'موقوف':
      return lang === 'ar' ? 'موقوف' : 'Suspended';
    default:
      return status;
  }
}

export function getStudentStatusColor(status?: string): { bg: string; text: string; border: string } {
  if (!status) return { bg: '#F1FAF5', text: '#0B7A55', border: '#CBEBDA' };

  const normalized = status.toLowerCase().trim();

  switch (normalized) {
    case 'active':
    case 'regular':
    case 'منتظم':
    case 'نشط':
      return { bg: '#F1FAF5', text: '#0B7A55', border: '#CBEBDA' };
    case 'absent':
    case 'غياب':
    case 'غياب بعذر':
      return { bg: '#FFF8EC', text: '#D97706', border: '#FDE68A' };
    case 'suspended':
    case 'موقوف':
      return { bg: '#FEE4E2', text: '#D92D20', border: '#FDA29B' };
    default:
      return { bg: '#EEF4FF', text: '#1246B7', border: '#D5E2F8' };
  }
}
