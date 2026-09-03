import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './ar';
import en from './en';

i18n.use(initReactI18next).init({
  resources: { ar: { translation: ar }, en: { translation: en } },
  lng: 'ar',
  fallbackLng: 'ar',
  interpolation: { escapeValue: false },
});

// Explicit deterministic RTL / LTR direction mapping
// Arabic (ar) -> 'rtl'
// English (en) -> 'ltr'
i18n.dir = (lng?: string): 'rtl' | 'ltr' => {
  const current = lng || i18n.language || 'ar';
  return current.toLowerCase().startsWith('ar') ? 'rtl' : 'ltr';
};

export function getAppDirection(lng?: string): 'rtl' | 'ltr' {
  const current = lng || i18n.language || 'ar';
  return current.toLowerCase().startsWith('ar') ? 'rtl' : 'ltr';
}

export function isAppRTL(lng?: string): boolean {
  return getAppDirection(lng) === 'rtl';
}

/**
 * Updates i18next language only.
 * I18nManager.forceRTL() is managed exclusively in App.tsx to avoid
 * duplicate calls and render loops.
 */
export function setAppLanguage(lang: 'ar' | 'en') {
  i18n.changeLanguage(lang);
}

export default i18n;
