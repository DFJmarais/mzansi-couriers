import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '@/components/Phase2Features';

type Language = 'en' | 'zu' | 'xh';

interface LocalizationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  // Load saved language preference
  useEffect(() => {
    const saved = localStorage.getItem('mzansi_language') as Language;
    if (saved && ['en', 'zu', 'xh'].includes(saved)) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('mzansi_language', lang);
    // Update document language attribute for accessibility
    document.documentElement.lang = lang;
  };

  const t = (key: keyof typeof translations.en): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <LocalizationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within LocalizationProvider');
  }
  return context;
};
