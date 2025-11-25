"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { translate as translateText } from '../lib/translations';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('language');
      if (stored === 'en' || stored === 'es') {
        return stored;
      }
    }
    return 'en';
  });

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const newLang = prev === 'en' ? 'es' : 'en';
      localStorage.setItem('language', newLang);
      return newLang;
    });
  };

  const t = (text: string): string => {
    return translateText(text, language);
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
