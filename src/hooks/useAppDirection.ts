/**
 * useAppDirection — Single source of truth for RTL/LTR direction.
 *
 * Architecture: Pure Native RTL
 * ─────────────────────────────
 * This app uses I18nManager.forceRTL() (set in index.ts before first render)
 * as the ground truth for layout direction. React Native's native RTL support
 * automatically handles flexDirection:'row' reversal, so components should NOT
 * add manual `flexDirection:'row-reverse'` — that causes double-inversion.
 *
 * Usage:
 *   const { isRTL } = useAppDirection();
 *
 * `isRTL` here reflects the JS lang state from uiStore. After a language switch
 * + app restart, isRTL and I18nManager.isRTL are always in sync.
 *
 * Use `isRTL` for:
 *   - Text content selection: `isRTL ? labelAr : labelEn`
 *   - Physical absolute positioning: `isRTL ? { right: 0 } : { left: 0 }`
 *   - Directional icon transform: `style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}`
 *
 * Do NOT use `isRTL` to add `flexDirection:'row-reverse'` — native RTL handles that.
 */
import { I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '../store/uiStore';
import { isLanguageRTL } from '../theme/typography';

export interface AppDirectionResult {
  /** True when the current language is Arabic (RTL). Derived from uiStore.lang. */
  isRTL: boolean;
  /** 'rtl' | 'ltr' — matches CSS/HTML dir attribute semantics. */
  dir: 'rtl' | 'ltr';
  /** The active language code from the UI store: 'ar' | 'en'. */
  lang: 'ar' | 'en';
  /**
   * The native layout direction as reported by I18nManager.
   * After a language switch + app restart this equals `isRTL`.
   * Use this for absolute physical positioning when needed.
   */
  nativeIsRTL: boolean;
}

export function useAppDirection(): AppDirectionResult {
  // Keep i18n in sync — calling useTranslation ensures the component
  // re-renders when i18n.changeLanguage() is called alongside setLang().
  useTranslation();

  const lang = useUiStore((s) => s.lang);
  const isRTL = isLanguageRTL(lang);

  return {
    isRTL,
    dir: isRTL ? 'rtl' : 'ltr',
    lang,
    nativeIsRTL: I18nManager.isRTL,
  };
}

export default useAppDirection;
