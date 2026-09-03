import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { setAppLanguage } from '../i18n';
import { applyGlobalTypography } from '../theme/typography';

type Lang = 'ar' | 'en';
type Theme = 'light' | 'dark';
type Calendar = 'auto' | 'hijri' | 'gregorian';

interface UiState {
  lang: Lang;
  theme: Theme;
  calendar: Calendar;
  effectiveCalendar: 'hijri' | 'gregorian';
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setCalendar: (cal: Calendar) => void;
  hydrate: () => Promise<void>;
}

export const useUiStore = create<UiState>((set, get) => ({
  lang: 'ar',
  theme: 'light',
  calendar: 'auto',
  effectiveCalendar: 'hijri',

  setLang: (lang) => {
    set((s) => ({ lang, effectiveCalendar: computeEffective(s.calendar, lang) }));
    setAppLanguage(lang);
    applyGlobalTypography(lang);
    try {
      SecureStore.setItemAsync('smos_lang', lang).catch(() => {});
    } catch {}
  },
  toggleLang: () => {
    const next = get().lang === 'ar' ? 'en' : 'ar';
    get().setLang(next);
  },
  setTheme: (theme) => {
    set({ theme });
    try {
      SecureStore.setItemAsync('smos_theme', theme).catch(() => {});
    } catch {}
  },
  toggleTheme: () => get().setTheme(get().theme === 'light' ? 'dark' : 'light'),
  setCalendar: (calendar) => {
    set((s) => ({ calendar, effectiveCalendar: computeEffective(calendar, s.lang) }));
    try {
      SecureStore.setItemAsync('smos_calendar', calendar).catch(() => {});
    } catch {}
  },
  hydrate: async () => {
    try {
      const [lang, theme, cal] = await Promise.all([
        SecureStore.getItemAsync('smos_lang').catch(() => null),
        SecureStore.getItemAsync('smos_theme').catch(() => null),
        SecureStore.getItemAsync('smos_calendar').catch(() => null),
      ]);
      const l = (lang as Lang) || 'ar';
      const t = (theme as Theme) || 'light';
      const c = (cal as Calendar) || 'auto';
      set({ lang: l, theme: t, calendar: c, effectiveCalendar: computeEffective(c, l) });
      setAppLanguage(l);
      applyGlobalTypography(l);
    } catch {
      // Default UI state if storage reading fails
      set({ lang: 'ar', theme: 'light', calendar: 'auto', effectiveCalendar: 'hijri' });
      setAppLanguage('ar');
      applyGlobalTypography('ar');
    }
  },
}));

function computeEffective(cal: Calendar, lang: Lang): 'hijri' | 'gregorian' {
  return cal === 'hijri' || cal === 'gregorian' ? cal : lang === 'ar' ? 'hijri' : 'gregorian';
}

export default useUiStore;
