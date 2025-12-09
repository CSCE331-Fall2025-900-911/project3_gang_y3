"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

export default function ManagerButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push('/manager')}
      className="fixed top-6 right-24 z-50 px-4 py-3 rounded-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors shadow-lg text-white font-semibold"
      aria-label="Go to Manager View"
    >
      Manager
    </button>
  );
}
