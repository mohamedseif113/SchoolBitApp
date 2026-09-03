import React from 'react';
import { Text, TextProps, TextStyle, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '../../store/uiStore';
import {
  getTypographyStyles,
  FontWeightKey,
  getFontFamily,
  resolveFontFamilyFromWeight,
  getTextAlign,
  getWritingDirection,
  isLanguageRTL,
} from '../../theme/typography';

export type TypographyVariant =
  | 'hero'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'cardTitle'
  | 'subtitle'
  | 'body'
  | 'bodyBold'
  | 'caption'
  | 'captionBold'
  | 'label'
  | 'button';

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  weight?: FontWeightKey;
  color?: string;
  align?: 'start' | 'end' | 'center';
  isNumeric?: boolean;
  style?: TextStyle | (TextStyle | undefined)[];
  children?: React.ReactNode;
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  weight,
  color,
  align = 'start',
  isNumeric = false,
  style,
  children,
  ...rest
}) => {
  const { i18n } = useTranslation();
  const { lang, theme } = useUiStore();
  const isRTL = isLanguageRTL(lang || i18n.language);
  const isDark = theme === 'dark';

  const baseStyles = getTypographyStyles(isRTL)[variant];
  const flattenedStyle = StyleSheet.flatten(style);
  const resolvedWeight = weight || (flattenedStyle?.fontWeight as any);
  const targetFont = resolvedWeight
    ? resolveFontFamilyFromWeight(resolvedWeight)
    : baseStyles.fontFamily;

  const dynamicStyle: TextStyle = {
    ...baseStyles,
    fontFamily: targetFont,
    textAlign: getTextAlign(isRTL, align),
    writingDirection: isNumeric ? 'ltr' : getWritingDirection(isRTL),
    color: color || (isDark ? '#F8FAFC' : baseStyles.color || '#0A1D3D'),
  };

  return (
    <Text style={[style, dynamicStyle, { fontFamily: targetFont }]} {...rest}>
      {children}
    </Text>
  );
};

export default AppText;
