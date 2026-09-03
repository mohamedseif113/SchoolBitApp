export * from './colors';
export * from './spacing';
export * from './typography';

import { colors, statusColors } from './colors';
import { spacing, borderRadius, iconSizes, layout, shadows } from './spacing';
import {
  arabicFontFamily,
  englishFontFamily,
  fontSizes,
  lineHeights,
  fontWeights,
  typography,
  getFontFamily,
  getTextAlign,
  getFlexDirection,
  getWritingDirection,
  getTypographyStyles,
} from './typography';

export const fontFamily = arabicFontFamily;

/**
 * Unified SchoolBit theme object
 */
export const theme = {
  colors,
  statusColors,
  spacing,
  borderRadius,
  iconSizes,
  layout,
  shadows,
  fontFamily: arabicFontFamily,
  arabicFontFamily,
  englishFontFamily,
  fontSizes,
  lineHeights,
  fontWeights,
  typography,
  getFontFamily,
  getTextAlign,
  getFlexDirection,
  getWritingDirection,
  getTypographyStyles,
} as const;

export type Theme = typeof theme;
export default theme;
