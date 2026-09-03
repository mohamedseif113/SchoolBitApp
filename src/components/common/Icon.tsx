import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import {
  Users,
  User,
  UserCheck,
  UserPlus,
  BarChart2,
  ClipboardList,
  Bell,
  Clock,
  Calendar,
  Plus,
  MessageSquare,
  Check,
  CheckCircle,
  School,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Shield,
  ShieldCheck,
  Smartphone,
  Lock,
  Moon,
  Sun,
  Globe,
  Headphones,
  FileText,
  FileCheck,
  LogOut,
  Edit3,
  Phone,
  Mail,
  X,
  Info,
  RefreshCw,
  Award,
  MapPin,
  AlertTriangle,
  CreditCard,
  Zap,
  Home,
  Menu,
  Grid,
  Settings,
  Search,
  Circle,
  GraduationCap,
  BookOpen,
  Building,
  Building2,
  Eye,
  EyeOff,
  Link,
  Trash2,
  Copy,
  ExternalLink,
  Filter,
  Download,
  Upload,
  LucideProps,
} from 'lucide-react-native';
import { colors } from '../../theme/colors';

export type IconName =
  | 'users'
  | 'user'
  | 'staff'
  | 'userCheck'
  | 'userPlus'
  | 'chart'
  | 'barChart'
  | 'clipboard'
  | 'bell'
  | 'clock'
  | 'calendar'
  | 'plus'
  | 'message'
  | 'check'
  | 'checkCircle'
  | 'school'
  | 'chevronRight'
  | 'chevronLeft'
  | 'chevronDown'
  | 'shield'
  | 'shieldCheck'
  | 'smartphone'
  | 'lock'
  | 'moon'
  | 'sun'
  | 'globe'
  | 'headphones'
  | 'fileText'
  | 'fileCheck'
  | 'logout'
  | 'logOut'
  | 'edit'
  | 'phone'
  | 'email'
  | 'close'
  | 'info'
  | 'refresh'
  | 'award'
  | 'location'
  | 'alertTriangle'
  | 'creditCard'
  | 'activity'
  | 'home'
  | 'menu'
  | 'grid'
  | 'settings'
  | 'search'
  | 'dot'
  | 'graduationCap'
  | 'bookOpen'
  | 'building'
  | 'eye'
  | 'eyeOff'
  | 'zap'
  | 'link'
  | 'trash'
  | 'copy'
  | 'externalLink'
  | 'filter'
  | 'download'
  | 'upload';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: ViewStyle | (ViewStyle | undefined)[];
}

const lucideComponentMap: Record<IconName, React.FC<LucideProps>> = {
  users: Users,
  user: User,
  staff: UserCheck,
  userCheck: UserCheck,
  userPlus: UserPlus,
  chart: BarChart2,
  barChart: BarChart2,
  clipboard: ClipboardList,
  bell: Bell,
  clock: Clock,
  calendar: Calendar,
  plus: Plus,
  message: MessageSquare,
  check: Check,
  checkCircle: CheckCircle,
  school: School,
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  chevronDown: ChevronDown,
  shield: Shield,
  shieldCheck: ShieldCheck,
  smartphone: Smartphone,
  lock: Lock,
  moon: Moon,
  sun: Sun,
  globe: Globe,
  headphones: Headphones,
  fileText: FileText,
  fileCheck: FileCheck,
  logout: LogOut,
  logOut: LogOut,
  edit: Edit3,
  phone: Phone,
  email: Mail,
  close: X,
  info: Info,
  refresh: RefreshCw,
  award: Award,
  location: MapPin,
  alertTriangle: AlertTriangle,
  creditCard: CreditCard,
  activity: Zap,
  home: Home,
  menu: Menu,
  grid: Grid,
  settings: Settings,
  search: Search,
  dot: Circle,
  graduationCap: GraduationCap,
  bookOpen: BookOpen,
  building: Building,
  eye: Eye,
  eyeOff: EyeOff,
  zap: Zap,
  link: Link,
  trash: Trash2,
  copy: Copy,
  externalLink: ExternalLink,
  filter: Filter,
  download: Download,
  upload: Upload,
};

export const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  color = colors.navy,
  strokeWidth = 1.9,
  style,
}) => {
  const Component = lucideComponentMap[name] || Circle;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Component size={size} color={color} strokeWidth={strokeWidth} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Icon;
