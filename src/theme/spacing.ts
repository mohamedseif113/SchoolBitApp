import { Platform, ViewStyle } from 'react-native';

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
  massive: 64,
} as const;

export type SpacingKey = keyof typeof spacing;

export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  pill: 9999,
  full: 9999,
} as const;

export type BorderRadiusKey = keyof typeof borderRadius;

export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  base: 24,
  lg: 28,
  xl: 32,
  xxl: 40,
  huge: 48,
} as const;

export type IconSizeKey = keyof typeof iconSizes;

export const layout = {
  screenPaddingHorizontal: spacing.base,
  screenPaddingVertical: spacing.base,
  cardPadding: spacing.base,
  cardBorderRadius: borderRadius.lg,
  modalBorderRadius: borderRadius.xl,
  headerHeight: 56,
  bottomTabBarHeight: 64,
  touchableMinHeight: 44,
  buttonHeight: {
    sm: 36,
    md: 46,
    lg: 54,
  },
  inputHeight: {
    sm: 38,
    md: 48,
    lg: 56,
  },
  avatar: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
    xxl: 80,
  },
  badgeHeight: 22,
} as const;

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } as ViewStyle,
  xs: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#0A1D3D',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
    },
    android: {
      elevation: 1,
    },
    default: {
      shadowColor: '#0A1D3D',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
    },
  }),
  sm: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#0A1D3D',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
    default: {
      shadowColor: '#0A1D3D',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    },
  }),
  md: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#0A1D3D',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
    default: {
      shadowColor: '#0A1D3D',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
  }),
  lg: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#0A1D3D',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
    android: {
      elevation: 8,
    },
    default: {
      shadowColor: '#0A1D3D',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
  }),
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#0A1D3D',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
    },
    android: {
      elevation: 2,
    },
    default: {
      shadowColor: '#0A1D3D',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
    },
  }),
} as const;

export default spacing;
