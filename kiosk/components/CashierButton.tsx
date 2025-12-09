"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

export default function CashierButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push('/cashier')}
      className="fixed top-6 right-52 z-50 px-4 py-3 rounded-full bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 transition-colors shadow-lg text-white font-semibold"
      aria-label="Go to Cashier View"
    >
      Cashier
    </button>
  );
}
