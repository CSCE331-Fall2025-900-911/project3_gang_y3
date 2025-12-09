"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { translate as translateText } from '../lib/translations';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('language');
      if (stored === 'en' || stored === 'es') {
        setLanguage(stored);
      }
    }
  }, []);

  useEffect(() => {
    // Re-render every 100ms to pick up new translations from cache
    if (mounted && language === 'es') {
      const interval = setInterval(() => {
        setUpdateTrigger(prev => prev + 1);
      }, 100);
      
      // Stop after 5 seconds
      setTimeout(() => clearInterval(interval), 5000);
      
      return () => clearInterval(interval);
    }
  }, [language, mounted]);

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
