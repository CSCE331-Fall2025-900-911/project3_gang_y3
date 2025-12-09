"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from './LanguageProvider';

export default function ManagerButton() {
  const router = useRouter();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="fixed top-6 right-24 z-50 px-4 py-3 rounded-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors shadow-lg text-white font-semibold"
        aria-label="Go to Manager View"
        disabled
      >
        Manager
      </button>
    );
  }

  return (
    <button
      onClick={() => router.push('/manager')}
      className="fixed top-6 right-24 z-50 px-4 py-3 rounded-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors shadow-lg text-white font-semibold"
      aria-label="Go to Manager View"
    >
      {t("Manager")}
    </button>
  );
}
