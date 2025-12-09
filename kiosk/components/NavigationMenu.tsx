"use client";
import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguage } from './LanguageProvider';

export default function NavigationMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  const pages = [
    { path: '/', label: 'Kiosk' },
    { path: '/cashier', label: 'Cashier' },
    { path: '/manager', label: 'Manager' },
  ];

  const handleNavigate = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  return (
    <div className="fixed top-4 left-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 dark:from-indigo-500 dark:to-indigo-600 dark:hover:from-indigo-600 dark:hover:to-indigo-700 text-white font-semibold shadow-lg transition-all active:shadow-md"
      >
        ☰ {t('Menu')}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-2xl overflow-hidden backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
          {pages.map((page) => (
            <button
              key={page.path}
              onClick={() => handleNavigate(page.path)}
              className={`w-full px-5 py-3 text-left font-medium transition-all ${
                pathname === page.path
                  ? 'bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/40 dark:to-blue-900/40 text-indigo-700 dark:text-indigo-300 border-l-4 border-indigo-600'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700/50'
              }`}
            >
              {t(page.label)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
