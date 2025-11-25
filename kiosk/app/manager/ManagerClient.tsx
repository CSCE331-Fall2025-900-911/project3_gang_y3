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

const mockSalesData = {
  today: 1247.50,
  yesterday: 1098.25,
  week: 8234.75,
  topCategories: [
    { name: 'Milk Tea', percentage: 45 },
    { name: 'Fruit Tea', percentage: 30 },
    { name: 'Specialty', percentage: 25 },
  ]
};

const mockRecentOrders = [
  { id: 1234, time: '2:45 PM', items: 3, total: 24.50 },
  { id: 1233, time: '2:42 PM', items: 2, total: 15.00 },
  { id: 1232, time: '2:38 PM', items: 5, total: 38.75 },
  { id: 1231, time: '2:35 PM', items: 1, total: 8.50 },
];

export default function ManagerClient() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 font-sans p-8 text-black dark:text-white transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Image className="dark:invert" src="/next.svg" alt="Next.js" width={56} height={14} priority />
          <h1 className="text-2xl font-semibold">Manager Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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

          <div className="bg-white dark:bg-zinc-800 p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Sales Summary</h2>
            <div className="space-y-4">
              <div className="p-4 rounded bg-blue-50 dark:bg-blue-900/30">
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Today</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${mockSalesData.today.toFixed(2)}
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 p-3 rounded bg-gray-50 dark:bg-zinc-700">
                  <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Yesterday</div>
                  <div className="text-lg font-semibold">${mockSalesData.yesterday.toFixed(2)}</div>
                </div>
                <div className="flex-1 p-3 rounded bg-gray-50 dark:bg-zinc-700">
                  <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">This Week</div>
                  <div className="text-lg font-semibold">${mockSalesData.week.toFixed(2)}</div>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-2">Top Categories</div>
                {mockSalesData.topCategories.map((cat, idx) => (
                  <div key={idx} className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{cat.name}</span>
                      <span className="text-gray-600 dark:text-gray-300">{cat.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 dark:bg-blue-600 h-2 rounded-full"
                        style={{ width: `${cat.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-800 p-6 rounded shadow lg:col-span-2 xl:col-span-1">
            <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
            <div className="space-y-3">
              {mockRecentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded bg-gray-50 dark:bg-zinc-700"
                >
                  <div>
                    <div className="font-medium">Order #{order.id}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      {order.time} • {order.items} items
                    </div>
                  </div>
                  <div className="font-semibold text-green-600 dark:text-green-400">
                    ${order.total.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
