import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, Translations, getTranslations, LANGUAGE_OPTIONS } from './utils/i18n';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType>({
  language: 'es',
  setLanguage: () => {},
  t: getTranslations('es'),
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('bh_stats_language');
    return (saved as Language) || 'es';
  });

  useEffect(() => {
    localStorage.setItem('bh_stats_language', language);
  }, [language]);

  const t = getTranslations(language);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export { LANGUAGE_OPTIONS };
export type { Language };
