"use client";
import React from 'react';
import Image from "next/image";

const mockInventory = [
  { name: 'Milk', quantity: 25, unit: 'gallons' },
  { name: 'Tea Leaves', quantity: 15, unit: 'lbs' },
  { name: 'Tapioca Pearls', quantity: 8, unit: 'lbs' },
  { name: 'Sugar', quantity: 30, unit: 'lbs' },
  { name: 'Cups', quantity: 500, unit: 'units' },
  { name: 'Straws', quantity: 450, unit: 'units' },
];

const mockBestSeller = { name: 'Milk Tea', sales: 45 };

export default function ManagerClient() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 font-sans p-8 text-black dark:text-white transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Image className="dark:invert" src="/next.svg" alt="Next.js" width={56} height={14} priority />
          <h1 className="text-2xl font-semibold">Manager Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inventory Widget */}
          <div className="bg-white dark:bg-zinc-800 p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Current Inventory</h2>
            <div className="space-y-3">
              {mockInventory.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 rounded bg-gray-50 dark:bg-zinc-700"
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="text-sm">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Best Seller Widget */}
          <div className="bg-white dark:bg-zinc-800 p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Best Seller Today</h2>
            <div className="bg-green-50 dark:bg-green-900/30 p-6 rounded text-center">
              <div className="text-3xl font-bold mb-2">{mockBestSeller.name}</div>
              <div className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2">
                {mockBestSeller.sales}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                orders today
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
