import { TextStyle, PixelRatio, Platform, Text, TextInput } from 'react-native';

/**
 * IBM Plex Sans Arabic Global Font Family Definitions (`font-ibm-plex-arabic`)
 */
export const ibmPlexArabicFontFamily = {
  thin: 'IBMPlexSansArabic_100Thin',
  extraLight: 'IBMPlexSansArabic_200ExtraLight',
  light: 'IBMPlexSansArabic_300Light',
  regular: 'IBMPlexSansArabic_400Regular',
  medium: 'IBMPlexSansArabic_500Medium',
  semiBold: 'IBMPlexSansArabic_600SemiBold',
  bold: 'IBMPlexSansArabic_700Bold',
  extraBold: 'IBMPlexSansArabic_700Bold',
} as const;

export const arabicFontFamily = ibmPlexArabicFontFamily;
export const englishFontFamily = ibmPlexArabicFontFamily;

export type FontWeightKey = 'thin' | 'extraLight' | 'light' | 'regular' | 'medium' | 'semiBold' | 'bold' | 'extraBold';

/**
 * Standardized typography scale (Increased by 10-15% for enhanced readability & visual hierarchy)
 */
export const fontSizes = {
  xxs: 10,
  xs: 12,
  sm: 13,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  h1: 26,
  hero: 32,
} as const;

export const lineHeights = {
  xxs: 14,
  xs: 16,
  sm: 18,
  md: 20,
  lg: 24,
  xl: 28,
  xxl: 32,
  h1: 36,
  hero: 44,
} as const;

export const fontWeights = {
  thin: '100',
  extraLight: '200',
  light: '300',
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
} as const;

/**
 * Safe Font Scaling Helper
 */
export function scaleFontSize(size: number): number {
  const fontScale = PixelRatio.getFontScale();
  const clampedScale = Math.min(Math.max(fontScale, 0.85), 1.25);
  return Math.round(size * clampedScale);
}

/**
 * Check if a language code represents RTL (Arabic)
 */
export function isLanguageRTL(lang?: string): boolean {
  return (lang || 'ar').toLowerCase().startsWith('ar');
}

/**
 * Resolves font family globally using IBM Plex Arabic based on font weight
 */
export function resolveFontFamilyFromWeight(weight?: string | number): string {
  if (!weight) return ibmPlexArabicFontFamily.regular;
  const w = String(weight).toLowerCase();
  if (w === 'bold' || w === '700' || w === '800' || w === '900' || w === 'heavy') {
    return ibmPlexArabicFontFamily.bold;
  }
  if (w === '600' || w === 'semibold') {
    return ibmPlexArabicFontFamily.semiBold;
  }
  if (w === '500' || w === 'medium') {
    return ibmPlexArabicFontFamily.medium;
  }
  if (w === '300' || w === 'light') {
    return ibmPlexArabicFontFamily.light;
  }
  if (w === '100' || w === '200' || w === 'thin') {
    return ibmPlexArabicFontFamily.thin;
  }
  return ibmPlexArabicFontFamily.regular;
}

/**
 * Resolves font family globally using IBM Plex Arabic
 */
export function getFontFamily(isRTL: boolean, weight: FontWeightKey = 'regular'): string {
  return ibmPlexArabicFontFamily[weight] || resolveFontFamilyFromWeight(weight);
}

/**
 * Directional Layout & Text Alignment Helpers
 * Arabic (ar)  -> align right, direction rtl
 * English (en) -> align left, direction ltr
 */
export function getTextAlign(isRTL: boolean, align: 'start' | 'end' | 'center' = 'start'): TextStyle['textAlign'] {
  if (align === 'center') return 'center';
  if (align === 'start') return isRTL ? 'right' : 'left';
  return isRTL ? 'left' : 'right';
}

export function getFlexDirection(isRTL: boolean, reverse = false): 'row' | 'row-reverse' {
  if (reverse) {
    return isRTL ? 'row' : 'row-reverse';
  }
  return isRTL ? 'row-reverse' : 'row';
}

export function getWritingDirection(isRTL: boolean): TextStyle['writingDirection'] {
  return isRTL ? 'rtl' : 'ltr';
}

/**
 * Apply global typography defaults across React Native core Text, TextInput,
 * and Web DOM using IBM Plex Arabic as the universal application font.
 */
export function applyGlobalTypography(lang: string = 'ar') {
  const isRTL = isLanguageRTL(lang);
  const targetFont = ibmPlexArabicFontFamily.regular;
  const writingDirection = isRTL ? 'rtl' : 'ltr';
  const textAlign = isRTL ? 'right' : 'left';

  // React Native Text global defaults
  const customTextProps: any = (Text as any).defaultProps || {};
  (Text as any).defaultProps = {
    ...customTextProps,
    style: {
      fontFamily: targetFont,
      writingDirection,
      textAlign,
    },
  };

  // React Native TextInput global defaults
  const customInputProps: any = (TextInput as any).defaultProps || {};
  (TextInput as any).defaultProps = {
    ...customInputProps,
    style: {
      fontFamily: targetFont,
      writingDirection,
      textAlign,
    },
  };

  // Web global stylesheet injection if running on web
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const styleId = 'schoolbit-global-typography';
    let styleTag = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = isRTL ? 'ar' : 'en';

    styleTag.textContent = `
      html, body, #root {
        font-family: 'IBMPlexSansArabic_400Regular', 'IBMPlexSansArabic', sans-serif !important;
        direction: ${isRTL ? 'rtl' : 'ltr'} !important;
        text-align: ${isRTL ? 'right' : 'left'} !important;
      }
      * {
        font-family: 'IBMPlexSansArabic_400Regular', 'IBMPlexSansArabic', sans-serif;
      }
      h1, h2, h3, h4, h5, h6 {
        font-family: 'IBMPlexSansArabic_700Bold', 'IBMPlexSansArabic', sans-serif !important;
        text-align: ${isRTL ? 'right' : 'left'} !important;
      }
      input, textarea, select, button {
        font-family: 'IBMPlexSansArabic_400Regular', 'IBMPlexSansArabic', sans-serif !important;
        text-align: ${isRTL ? 'right' : 'left'} !important;
      }
    `;
  }
}

/**
 * Standardized typography variants generator with explicit direction and alignment
 */
export function getTypographyStyles(isRTL: boolean) {
  const align = getTextAlign(isRTL, 'start');
  const writingDir = getWritingDirection(isRTL);

  return {
    hero: {
      fontFamily: ibmPlexArabicFontFamily.extraBold,
      fontSize: fontSizes.hero,
      lineHeight: lineHeights.hero,
      fontWeight: fontWeights.extraBold as any,
      textAlign: align,
      writingDirection: writingDir,
    } as TextStyle,
    h1: {
      fontFamily: ibmPlexArabicFontFamily.bold,
      fontSize: fontSizes.h1,
      lineHeight: lineHeights.h1,
      fontWeight: fontWeights.bold as any,
      textAlign: align,
      writingDirection: writingDir,
    } as TextStyle,
    h2: {
      fontFamily: ibmPlexArabicFontFamily.bold,
      fontSize: fontSizes.xxl,
      lineHeight: lineHeights.xxl,
      fontWeight: fontWeights.bold as any,
      textAlign: align,
      writingDirection: writingDir,
    } as TextStyle,
    h3: {
      fontFamily: ibmPlexArabicFontFamily.semiBold,
      fontSize: fontSizes.xl,
      lineHeight: lineHeights.xl,
      fontWeight: fontWeights.semiBold as any,
      textAlign: align,
      writingDirection: writingDir,
    } as TextStyle,
    cardTitle: {
      fontFamily: ibmPlexArabicFontFamily.bold,
      fontSize: fontSizes.lg,
      lineHeight: lineHeights.lg,
      fontWeight: fontWeights.bold as any,
      textAlign: align,
      writingDirection: writingDir,
    } as TextStyle,
    subtitle: {
      fontFamily: ibmPlexArabicFontFamily.medium,
      fontSize: fontSizes.md,
      lineHeight: lineHeights.md,
      fontWeight: fontWeights.medium as any,
      textAlign: align,
      writingDirection: writingDir,
    } as TextStyle,
    body: {
      fontFamily: ibmPlexArabicFontFamily.regular,
      fontSize: fontSizes.md,
      lineHeight: lineHeights.md,
      fontWeight: fontWeights.regular as any,
      textAlign: align,
      writingDirection: writingDir,
    } as TextStyle,
    bodyBold: {
      fontFamily: ibmPlexArabicFontFamily.bold,
      fontSize: fontSizes.md,
      lineHeight: lineHeights.md,
      fontWeight: fontWeights.bold as any,
      textAlign: align,
      writingDirection: writingDir,
    } as TextStyle,
    caption: {
      fontFamily: ibmPlexArabicFontFamily.regular,
      fontSize: fontSizes.xs,
      lineHeight: lineHeights.xs,
      fontWeight: fontWeights.regular as any,
      textAlign: align,
      writingDirection: writingDir,
    } as TextStyle,
    captionBold: {
      fontFamily: ibmPlexArabicFontFamily.semiBold,
      fontSize: fontSizes.xs,
      lineHeight: lineHeights.xs,
      fontWeight: fontWeights.semiBold as any,
      textAlign: align,
      writingDirection: writingDir,
    } as TextStyle,
    label: {
      fontFamily: ibmPlexArabicFontFamily.semiBold,
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontWeight: fontWeights.semiBold as any,
      textAlign: align,
      writingDirection: writingDir,
    } as TextStyle,
    button: {
      fontFamily: ibmPlexArabicFontFamily.bold,
      fontSize: fontSizes.md,
      lineHeight: lineHeights.md,
      fontWeight: fontWeights.bold as any,
      textAlign: 'center',
      writingDirection: writingDir,
    } as TextStyle,
  };
}

export const typography = getTypographyStyles(true);
