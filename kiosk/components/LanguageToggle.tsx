"use client";
import React, { useState, useEffect } from 'react';
import { useLanguage } from './LanguageProvider';

export default function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="fixed top-4 right-20 z-50 px-4 py-3 rounded-full bg-gray-200 dark:bg-gray-700 transition-colors shadow-lg"
        aria-label="Toggle language"
        disabled
      >
        <span className="font-semibold text-gray-800 dark:text-gray-200">EN</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleLanguage}
      className="fixed top-4 right-20 z-50 px-4 py-3 rounded-full bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 transition-colors shadow-lg"
      aria-label="Toggle language"
    >
      <span className="font-semibold text-white">
        {language === 'en' ? 'EN' : 'ES'}
      </span>
    </button>
  );
}
