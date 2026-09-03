export const colors = {
  navy: '#0A1D3D',
  navyCard: '#13294F',
  blue: '#1246B7',
  brandPrimary: '#1D4ED8',
  brandPrimaryHover: '#1E40AF',
  heroNavy: '#07132B',
  heroDarkCard: '#0B1938',
  formCanvasLight: '#F4F7FB',
  formCanvasDark: '#07132B',
  cardBgLight: '#FFFFFF',
  cardBgDark: '#0F244A',
  inputBorder: '#E2E8F0',
  inputBorderFocus: '#1D4ED8',
  inputBgLight: '#FFFFFF',
  inputBgDark: '#1E293B',
  sky: '#1E88FF',
  skyLight: '#6EC5FF',
  line: '#E1E7F0',
  lineSoft: '#EDF1F6',
  tx1: '#5A6784',
  tx2: '#77839B',
  tx3: '#98A2B7',
  onNavy: '#8FA0BF',
  ok: '#0B7A55',
  okBg: '#F1FAF5',
  okLine: '#CBEBDA',
  warn: '#FF8A00',
  pink: '#E91E8E',
  pinkText: '#C0126F',
  pinkBg: '#FEF0F7',
  pinkLine: '#FBD0E6',
  infoBg: '#EEF4FF',
  infoLine: '#D5E2F8',
  infoText: '#41598A',
  bg0: '#F2F4F7',
  white: '#FFFFFF',
} as const;

export type ColorName = keyof typeof colors;

/**
 * Status color mappings for badges, alerts, and indicators
 */
export const statusColors = {
  success: {
    text: colors.ok,
    bg: colors.okBg,
    border: colors.okLine,
  },
  warning: {
    text: colors.warn,
    bg: '#FFF8EC',
    border: '#FFE0B2',
  },
  danger: {
    text: colors.pinkText,
    bg: colors.pinkBg,
    border: colors.pinkLine,
  },
  info: {
    text: colors.infoText,
    bg: colors.infoBg,
    border: colors.infoLine,
  },
  neutral: {
    text: colors.tx2,
    bg: colors.bg0,
    border: colors.line,
  },
} as const;

/**
 * Helper to convert hex color to rgba string with specified opacity (0 - 1)
 */
export function withOpacity(hexColor: string, opacity: number): string {
  const normalizedHex = hexColor.replace('#', '');
  if (normalizedHex.length === 3) {
    const r = parseInt(normalizedHex[0] + normalizedHex[0], 16);
    const g = parseInt(normalizedHex[1] + normalizedHex[1], 16);
    const b = parseInt(normalizedHex[2] + normalizedHex[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  if (normalizedHex.length === 6) {
    const r = parseInt(normalizedHex.substring(0, 2), 16);
    const g = parseInt(normalizedHex.substring(2, 4), 16);
    const b = parseInt(normalizedHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return hexColor;
}

export default colors;
