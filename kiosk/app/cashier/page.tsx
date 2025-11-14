"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import Image from "next/image";

export default function CashierView() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 dark:bg-zinc-900 font-sans p-8 text-black dark:text-white transition-colors">
      <main className="w-full max-w-3xl bg-white dark:bg-zinc-800 p-8 shadow rounded text-black dark:text-white transition-colors">
        <div className="flex items-center gap-4 mb-6">
          <Image className="dark:invert" src="/next.svg" alt="Next.js" width={56} height={14} priority />
          <h1 className="text-2xl font-semibold">Cashier View</h1>
        </div>

        <div className="flex justify-end mb-4">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 rounded bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 transition-colors text-white font-medium"
          >
            Back to Kiosk
          </button>
        </div>
      </main>
    </div>
  );
}
