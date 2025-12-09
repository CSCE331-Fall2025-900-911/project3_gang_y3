"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from './LanguageProvider';

export default function CashierButton() {
  const router = useRouter();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="fixed top-6 right-52 z-50 px-4 py-3 rounded-full bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 transition-colors shadow-lg text-white font-semibold"
        aria-label="Go to Cashier View"
        disabled
      >
        Cashier
      </button>
    );
  }

  return (
    <button
      onClick={() => router.push('/cashier')}
      className="fixed top-6 right-52 z-50 px-4 py-3 rounded-full bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 transition-colors shadow-lg text-white font-semibold"
      aria-label="Go to Cashier View"
    >
      {t("Cashier")}
    </button>
  );
}
