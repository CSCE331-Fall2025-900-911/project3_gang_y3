"use client";
import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguage } from './LanguageProvider';
import LoginModal from './LoginModal';

export default function NavigationMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogin, setShowLogin] = useState<'Manager' | 'Cashier' | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  const pages = [
    { path: '/', label: 'Kiosk' },
    { path: '/cashier', label: 'Cashier', requiresAuth: true },
    { path: '/manager', label: 'Manager', requiresAuth: true },
  ];

  const handleNavigate = (path: string, label: string, requiresAuth?: boolean) => {
    setIsOpen(false);
    
    if (requiresAuth && (label === 'Cashier' || label === 'Manager')) {
      setShowLogin(label as 'Manager' | 'Cashier');
    } else {
      router.push(path);
    }
  };

  return (
    <>
      <nav className="fixed top-4 left-4 z-50" aria-label="Main navigation">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 text-white font-medium shadow-lg transition-colors"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          ☰ {t('Menu')}
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-gray-600 rounded shadow-lg overflow-hidden" role="menu">
            {pages.map((page) => (
              <button
                key={page.path}
                onClick={() => handleNavigate(page.path, page.label, page.requiresAuth)}
                role="menuitem"
                className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors ${
                  pathname === page.path
                    ? 'bg-blue-100 dark:bg-blue-900/30 font-semibold text-blue-800 dark:text-blue-300'
                    : 'text-black dark:text-white'
                }`}
              >
                {t(page.label)}
              </button>
            ))}
          </div>
        )}
      </nav>

      {showLogin && (
        <LoginModal
          role={showLogin}
          onClose={() => setShowLogin(null)}
        />
      )}
    </>
  );
}
