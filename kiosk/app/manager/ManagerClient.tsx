"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from "next/image";
import { useLanguage } from '../../components/LanguageProvider';
import { useAuth } from '../../lib/useAuth';
import { signOut } from 'next-auth/react';
import type { InventoryItem, BestSeller, SalesData, RecentOrder, MenuItem } from '../../lib/managerData';

interface ManagerClientProps {
  initialData: {
    inventory: InventoryItem[];
    menuItems: MenuItem[];
    bestSeller: BestSeller;
    salesData: SalesData;
    recentOrders: RecentOrder[];
    totalOrdersToday: number;
    lowStockItems: InventoryItem[];
    categories: string[];
  };
}

export default function ManagerClient({ initialData }: ManagerClientProps) {
          // State for Product Usage Chart
          const [usageStart, setUsageStart] = useState('');
          const [usageEnd, setUsageEnd] = useState('');
          const [usageData, setUsageData] = useState<Array<{ item_name: string; used: number; unit: string }>>([]);
          const [loadingUsage, setLoadingUsage] = useState(false);

          const fetchUsageData = async () => {
            setLoadingUsage(true);
            const res = await fetch(`/api/manager/inventory-usage?start=${usageStart}&end=${usageEnd}`);
            if (res.ok) {
              const data = await res.json();
              setUsageData(data.usage || []);
            }
            setLoadingUsage(false);
          };
        // Add X-Report counters state if not present
        const [xReportCounters, setXReportCounters] = useState({
          hourlySales: 0,
          returns: 0,
          voids: 0,
          discards: 0,
          paymentMethods: {},
        });
      const [showZReportModal, setShowZReportModal] = useState(false);

      // Reset counters
      const handleRunZReport = () => {
        setShowZReportModal(true);
      };
      const handleConfirmZReport = () => {
        setInventoryUpdateCount(0);
        setXReportCounters({
          hourlySales: 0,
          returns: 0,
          voids: 0,
          discards: 0,
          paymentMethods: {},
        });
        setShowZReportModal(false);
        // Call backend API to reset counters
        fetch('/api/manager/reset-reports', {
          method: 'POST',
        });
      };
    // Track inventory updates (demo: in-memory, reset on reload)
    const [inventoryUpdateCount, setInventoryUpdateCount] = useState(0);

    // Red threshold for inventory (e.g., <10 units)
    const RED_THRESHOLD = 10;
    const redThresholdCount = initialData.inventory.filter(item => item.quantity_in_stock < RED_THRESHOLD).length;

    // Wrap inventory update handler to increment count
    const handleUpdateInventoryTracked = async () => {
      await handleUpdateInventory();
      setInventoryUpdateCount(c => c + 1);
    };
  const router = useRouter();
  const { t } = useLanguage();
  const { role, isLoading } = useAuth();
  const { inventory, bestSeller, salesData, recentOrders, totalOrdersToday, lowStockItems, menuItems, categories } = initialData;

  // State for editing menu
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [menuPrice, setMenuPrice] = useState('');
  const [menuInventoryLink, setMenuInventoryLink] = useState('');

  // State for editing inventory
  const [editingInventory, setEditingInventory] = useState<InventoryItem | null>(null);
  const [inventoryQty, setInventoryQty] = useState('');

  // State for adding new menu item
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuCategory, setNewMenuCategory] = useState('');
  const [newMenuPrice, setNewMenuPrice] = useState('');
  const [newMenuInventoryLink, setNewMenuInventoryLink] = useState('');

  // State for adding new inventory item
  const [showAddInventory, setShowAddInventory] = useState(false);
  const [newInventoryName, setNewInventoryName] = useState('');
  const [newInventoryQty, setNewInventoryQty] = useState('');
  const [newInventoryUnit, setNewInventoryUnit] = useState('');

  useEffect(() => {
    if (!isLoading && role !== 'Manager') {
      router.push('/');
    }
  }, [role, isLoading, router]);

  const handleSignOut = async () => {
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('pendingRole');
    sessionStorage.removeItem('pendingUsername');
    await signOut({ callbackUrl: '/' });
  };

  const handleRefresh = () => {
    router.refresh();
  };

  const handleUpdateMenuPrice = async () => {
    if (!editingMenu || !menuPrice) return;
    try {
      const res = await fetch('/api/manager/update-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          menuItemId: editingMenu.menu_item_id, 
          price: parseFloat(menuPrice),
          inventoryLink: menuInventoryLink
        })
      });
      if (res.ok) {
        setEditingMenu(null);
        setMenuPrice('');
        setMenuInventoryLink('');
        router.refresh();
      }
    } catch (error) {
      console.error('Error updating menu:', error);
    }
  };

  const handleAddMenuItem = async () => {
    if (!newMenuName || !newMenuCategory || !newMenuPrice) return;
    try {
      const res = await fetch('/api/manager/add-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: newMenuName,
          category: newMenuCategory,
          price: parseFloat(newMenuPrice),
          inventoryLink: newMenuInventoryLink || '{}'
        })
      });
      if (res.ok) {
        setShowAddMenu(false);
        setNewMenuName('');
        setNewMenuCategory('');
        setNewMenuPrice('');
        setNewMenuInventoryLink('');
        router.refresh();
      }
    } catch (error) {
      console.error('Error adding menu item:', error);
    }
  };

  const handleUpdateInventory = async () => {
    if (!editingInventory || !inventoryQty) return;
    try {
      const res = await fetch('/api/manager/update-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemName: editingInventory.item_name, quantity: parseInt(inventoryQty) })
      });
      if (res.ok) {
        setEditingInventory(null);
        setInventoryQty('');
        router.refresh();
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
    }
  };

  const handleAddInventoryItem = async () => {
    if (!newInventoryName || !newInventoryQty || !newInventoryUnit) return;
    try {
      const res = await fetch('/api/manager/add-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: newInventoryName,
          quantity: parseInt(newInventoryQty),
          unit: newInventoryUnit
        })
      });
      if (res.ok) {
        setShowAddInventory(false);
        setNewInventoryName('');
        setNewInventoryQty('');
        setNewInventoryUnit('');
        router.refresh();
      }
    } catch (error) {
      console.error('Error adding inventory item:', error);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 font-sans p-8 text-black dark:text-white transition-colors">
      <button
        onClick={handleRefresh}
        className="fixed top-4 right-64 z-50 px-4 py-3 rounded-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold transition-colors shadow-lg"
      >
        {t("Refresh")}
      </button>
      <button
        onClick={handleSignOut}
        className="fixed top-4 right-36 z-50 px-4 py-3 rounded-full bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white font-semibold transition-colors shadow-lg"
      >
        {t("Sign Out")}
      </button>
      <div className="max-w-7xl mx-auto">

        {/* Title */}
        <div className="flex items-center gap-4 mb-6">
          <Image className="dark:invert" src="/next.svg" alt="Next.js" width={56} height={14} priority />
          <h1 className="text-2xl font-semibold">{t("Manager Dashboard")}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {/* Product Usage Chart Widget */}
                                <div className="bg-white dark:bg-zinc-800 p-6 rounded shadow flex flex-col gap-4" style={{ minHeight: '400px' }}>
                                  <h2 className="text-xl font-semibold mb-2">Product Usage Chart</h2>
                                  <div className="mb-1 text-sm text-gray-600 dark:text-gray-300">Select a time window to view inventory usage.</div>
                                  <div className="flex flex-col gap-2 mb-2 w-full max-w-xs">
                                    <label className="text-xs font-medium">Start Date & Time</label>
                                    <input type="datetime-local" value={usageStart} onChange={e => setUsageStart(e.target.value)} className="px-2 py-1 rounded border w-full" />
                                    <label className="text-xs font-medium">End Date & Time</label>
                                    <input type="datetime-local" value={usageEnd} onChange={e => setUsageEnd(e.target.value)} className="px-2 py-1 rounded border w-full" />
                                    <button className="mt-2 px-3 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors" onClick={fetchUsageData} disabled={loadingUsage || !usageStart || !usageEnd}>Generate Usage Table</button>
                                  </div>
                                  {loadingUsage ? (
                                    <div className="text-center py-8">Loading...</div>
                                  ) : usageData.length > 0 ? (
                                    <div className="overflow-y-auto max-h-56 border rounded">
                                      <table className="w-full text-sm">
                                        <thead className="sticky top-0 bg-gray-100 dark:bg-zinc-700">
                                          <tr>
                                            <th className="p-2 text-left">Inventory Item</th>
                                            <th className="p-2 text-left">Amount Used</th>
                                            <th className="p-2 text-left">Unit</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {usageData.map((row, idx) => (
                                            <tr key={idx}>
                                              <td className="p-2">{row.item_name}</td>
                                              <td className="p-2">{row.used}</td>
                                              <td className="p-2">{row.unit}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <div className="text-center py-8 text-gray-500">No usage data for selected period.</div>
                                  )}
                                </div>
                        {/* X-Report Widget */}
                        <div className="bg-white dark:bg-zinc-800 p-6 rounded shadow">
                          <h2 className="text-xl font-semibold mb-4">X-Report</h2>
                          <div className="mb-2 text-sm text-gray-600 dark:text-gray-300">Sales activities per hour for today</div>
                          <div className="overflow-x-auto">
                            <table className="min-w-[900px] text-sm mb-2 border border-gray-200 dark:border-gray-700 rounded">
                              <thead>
                                <tr className="bg-gray-100 dark:bg-zinc-700">
                                  <th className="p-2 text-left">Hour</th>
                                  <th className="p-2 text-left">Sales</th>
                                  <th className="p-2 text-left">Returns</th>
                                  <th className="p-2 text-left">Voids</th>
                                  <th className="p-2 text-left">Discards</th>
                                  <th className="p-2 text-left">Payment Methods</th>
                                </tr>
                              </thead>
                              <tbody>
                                {salesData?.hourly?.map((row) => {
                                  const hour = row.hour;
                                  const ampm = hour < 12 ? 'am' : 'pm';
                                  const displayHour = hour === 12 ? '12pm' : hour > 12 ? `${hour-12}pm` : `${hour}${ampm}`;
                                  return (
                                    <tr key={hour}>
                                      <td className="p-2">{displayHour}</td>
                                      <td className="p-2">{row.sales}</td>
                                      <td className="p-2">{row.returns}</td>
                                      <td className="p-2">{row.voids}</td>
                                      <td className="p-2">{row.discards}</td>
                                      <td className="p-2">{row.paymentMethods.length > 0 ? row.paymentMethods.join(', ') : '—'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Z-Report Widget */}
                        <div className="bg-white dark:bg-zinc-800 p-6 rounded shadow" style={{ minHeight: '400px' }}>
                          <h2 className="text-xl font-semibold mb-4">Z-Report</h2>
                          <div className="mb-2 text-sm text-gray-600 dark:text-gray-300">End-of-day totals and reset</div>
                          <div className="space-y-2">
                            <div className="flex justify-between"><span>Sales</span><span>${salesData?.today.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Tax</span><span>$0.00</span></div>
                            <div className="flex justify-between"><span>Payment Methods</span><span>Cash, Card</span></div>
                            <div className="flex justify-between"><span>Total Cash</span><span>${salesData?.today.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Out of Stock Items</span><span>{menuItems.filter(item => item.availability === false).length}</span></div>
                            <div className="flex justify-between"><span>Items in Red Threshold</span><span>{redThresholdCount}</span></div>
                          </div>
                          <button className="mt-4 px-4 py-2 rounded bg-red-500 text-white font-semibold" onClick={handleRunZReport}>
                            Run Z-Report (Once per day)
                          </button>
                                        {showZReportModal && (
                                          <div className="fixed inset-0 z-50 flex items-center justify-center">
                                            <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={() => setShowZReportModal(false)}></div>
                                            <div className="relative z-10 w-[90%] max-w-lg rounded bg-white dark:bg-zinc-800 p-6 shadow-lg text-black dark:text-white transition-colors">
                                              <h3 className="text-lg font-semibold mb-3">Z-Report Summary</h3>
                                              <div className="space-y-2">
                                                <div className="flex justify-between"><span>Sales</span><span>${salesData?.today.toFixed(2)}</span></div>
                                                <div className="flex justify-between"><span>Tax</span><span>$0.00</span></div>
                                                <div className="flex justify-between"><span>Payment Methods</span><span>Cash, Card</span></div>
                                                <div className="flex justify-between"><span>Total Cash</span><span>${salesData?.today.toFixed(2)}</span></div>
                                                <div className="flex justify-between"><span>Out of Stock Items</span><span>{menuItems.filter(item => item.availability === false).length}</span></div>
                                                <div className="flex justify-between"><span>Items in Red Threshold</span><span>{redThresholdCount}</span></div>
                                                <div className="flex flex-col mt-4">
                                                  <span className="font-medium mb-1">Low Stock Items:</span>
                                                  {lowStockItems.length > 0 ? (
                                                    lowStockItems.map((item, idx) => (
                                                      <span key={idx}>{item.item_name}: {item.quantity_in_stock} {item.unit}</span>
                                                    ))
                                                  ) : (
                                                    <span>None</span>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="flex justify-end mt-6 gap-2">
                                                <button className="px-4 py-2 rounded bg-gray-300 dark:bg-zinc-700 text-black dark:text-white font-semibold" onClick={() => setShowZReportModal(false)}>Cancel</button>
                                                <button className="px-4 py-2 rounded bg-red-500 text-white font-semibold" onClick={handleConfirmZReport}>Confirm & Reset</button>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                        </div>
            <div className="bg-white dark:bg-zinc-800 p-6 rounded shadow" style={{ minHeight: '400px' }}>
              <h2 className="text-xl font-semibold mb-4">{t("Current Inventory")}</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {inventory.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 rounded bg-gray-50 dark:bg-zinc-700"
                  >
                    <span className="font-medium">{item.item_name}</span>
                    <span className="text-sm">
                      {item.quantity_in_stock} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-800 p-6 rounded shadow">
              <h2 className="text-xl font-semibold mb-4">{t("Best Seller Today")}</h2>
              <div className="bg-green-50 dark:bg-green-900/30 p-6 rounded text-center">
                <div className="text-3xl font-bold mb-2">{bestSeller.name}</div>
                <div className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2">
                  {bestSeller.sales}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {t("orders today")}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-800 p-6 rounded shadow">
              <h2 className="text-xl font-semibold mb-4">{t("Sales Summary")}</h2>
              <div className="space-y-4">
                <div className="p-4 rounded bg-blue-50 dark:bg-blue-900/30">
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">{t("Today")}</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ${(salesData?.today ?? 0).toFixed(2)}
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 p-3 rounded bg-gray-50 dark:bg-zinc-700">
                    <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">{t("Yesterday")}</div>
                    <div className="text-lg font-semibold">${(salesData?.yesterday ?? 0).toFixed(2)}</div>
                  </div>
                  <div className="flex-1 p-3 rounded bg-gray-50 dark:bg-zinc-700">
                    <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">{t("This Week")}</div>
                    <div className="text-lg font-semibold">${(salesData?.week ?? 0).toFixed(2)}</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">{t("Top Categories")}</div>
                  {salesData?.topCategories && salesData.topCategories.length > 0 ? (
                    salesData.topCategories.map((cat, idx) => (
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
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">{t("No sales data yet")}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-800 p-6 rounded shadow lg:col-span-2 xl:col-span-1">
              <h2 className="text-xl font-semibold mb-4">{t("Recent Orders")}</h2>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 rounded bg-gray-50 dark:bg-zinc-700"
                    >
                      <div>
                        <div className="font-medium">{t("Order")} #{order.id}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          {order.time} • {order.items} {t("items")}
                        </div>
                      </div>
                      <div className="font-semibold text-green-600 dark:text-green-400">
                        ${order.total.toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">{t("No orders today")}</div>
                )}
              </div>
            </div>

            {/* Total Orders Today Widget */}
            <div className="bg-white dark:bg-zinc-800 p-6 rounded shadow">
              <h2 className="text-xl font-semibold mb-4">{t("Total Orders")}</h2>
              <div className="bg-purple-50 dark:bg-purple-900/30 p-6 rounded text-center">
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">{t("Today")}</div>
                <div className="text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  {totalOrdersToday}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {t("completed orders")}
                </div>
              </div>
            </div>

            {/* Low Stock Alert Widget */}
            <div className="bg-white dark:bg-zinc-800 p-6 rounded shadow">
              <h2 className="text-xl font-semibold mb-4">{t("Low Stock Alert")}</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {lowStockItems.length > 0 ? (
                  lowStockItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-3 rounded bg-red-50 dark:bg-red-900/30"
                    >
                      <span className="font-medium">{item.item_name}</span>
                      <span className="text-sm text-red-600 dark:text-red-400 font-semibold">
                        {item.quantity_in_stock} {item.unit}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">{t("All items well stocked")}</div>
                )}
              </div>
            </div>

            {/* Edit Menu Prices Widget */}
            <div className="bg-white dark:bg-zinc-800 p-6 rounded shadow xl:col-span-2 lg:col-span-1">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{t("Edit Menu Items")}</h2>
                <button
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                >
                  {showAddMenu ? t("Cancel") : t("+ Add Item")}
                </button>
              </div>
              
              {/* Add New Menu Item Form */}
              {showAddMenu && (
                <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 rounded">
                  <h3 className="font-medium mb-3">{t("Add New Menu Item")}</h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder={t("Item Name")}
                      value={newMenuName}
                      onChange={(e) => setNewMenuName(e.target.value)}
                      className="px-3 py-2 rounded border dark:bg-zinc-600 dark:border-zinc-500"
                    />
                    <select
                      value={newMenuCategory}
                      onChange={(e) => setNewMenuCategory(e.target.value)}
                      className="px-3 py-2 rounded border dark:bg-zinc-600 dark:border-zinc-500"
                    >
                      <option value="">{t("Select Category")}</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.25"
                      placeholder={t("Price")}
                      value={newMenuPrice}
                      onChange={(e) => setNewMenuPrice(e.target.value)}
                      className="px-3 py-2 rounded border dark:bg-zinc-600 dark:border-zinc-500"
                    />
                    <input
                      type="text"
                      placeholder={t("Inventory Link (e.g. {1:1,2:2})")}
                      value={newMenuInventoryLink}
                      onChange={(e) => setNewMenuInventoryLink(e.target.value)}
                      className="px-3 py-2 rounded border dark:bg-zinc-600 dark:border-zinc-500"
                    />
                  </div>
                  <button
                    onClick={handleAddMenuItem}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    {t("Add Menu Item")}
                  </button>
                </div>
              )}

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {menuItems.map((item) => (
                  <div
                    key={item.menu_item_id}
                    className="p-3 rounded bg-gray-50 dark:bg-zinc-700"
                  >
                    {editingMenu?.menu_item_id === item.menu_item_id ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{item.item_name}</span>
                          <span className="text-xs text-gray-500">({item.category})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{t("Price")}: $</span>
                          <input
                            type="number"
                            step="0.25"
                            value={menuPrice}
                            onChange={(e) => setMenuPrice(e.target.value)}
                            className="w-20 px-2 py-1 rounded border dark:bg-zinc-600 dark:border-zinc-500"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{t("Inventory Link")}:</span>
                          <input
                            type="text"
                            value={menuInventoryLink}
                            onChange={(e) => setMenuInventoryLink(e.target.value)}
                            placeholder="{1:1,2:2}"
                            className="flex-1 px-2 py-1 rounded border dark:bg-zinc-600 dark:border-zinc-500 text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleUpdateMenuPrice}
                            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                          >
                            {t("Save")}
                          </button>
                          <button
                            onClick={() => { setEditingMenu(null); setMenuPrice(''); setMenuInventoryLink(''); }}
                            className="px-3 py-1 bg-gray-400 text-white rounded text-sm hover:bg-gray-500"
                          >
                            {t("Cancel")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{item.item_name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({item.category})</span>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {t("Link")}: {item.inventory_link || t("None")}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-green-600 dark:text-green-400">${Number(item.price).toFixed(2)}</span>
                          <button
                            onClick={() => { 
                              setEditingMenu(item); 
                              setMenuPrice(String(item.price)); 
                              setMenuInventoryLink(item.inventory_link || '');
                            }}
                            className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                          >
                            {t("Edit")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Update Inventory Widget */}
            <div className="bg-white dark:bg-zinc-800 p-6 rounded shadow xl:col-span-1 lg:col-span-1">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{t("Update Inventory")}</h2>
                <button
                  onClick={() => setShowAddInventory(!showAddInventory)}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                >
                  {showAddInventory ? t("Cancel") : t("+ Add")}
                </button>
              </div>

              {/* Add New Inventory Item Form */}
              {showAddInventory && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 rounded">
                  <h3 className="font-medium mb-2 text-sm">{t("Add New Ingredient")}</h3>
                  <div className="space-y-2 mb-2">
                    <input
                      type="text"
                      placeholder={t("Ingredient Name")}
                      value={newInventoryName}
                      onChange={(e) => setNewInventoryName(e.target.value)}
                      className="w-full px-2 py-1 rounded border dark:bg-zinc-600 dark:border-zinc-500 text-sm"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder={t("Quantity")}
                        value={newInventoryQty}
                        onChange={(e) => setNewInventoryQty(e.target.value)}
                        className="flex-1 px-2 py-1 rounded border dark:bg-zinc-600 dark:border-zinc-500 text-sm"
                      />
                      <input
                        type="text"
                        placeholder={t("Unit")}
                        value={newInventoryUnit}
                        onChange={(e) => setNewInventoryUnit(e.target.value)}
                        className="w-20 px-2 py-1 rounded border dark:bg-zinc-600 dark:border-zinc-500 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddInventoryItem}
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                  >
                    {t("Add")}
                  </button>
                </div>
              )}

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {inventory.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 rounded bg-gray-50 dark:bg-zinc-700"
                  >
                    <span className="font-medium text-sm">{item.item_name}</span>
                    {editingInventory?.item_name === item.item_name ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={inventoryQty}
                          onChange={(e) => setInventoryQty(e.target.value)}
                          className="w-16 px-2 py-1 rounded border dark:bg-zinc-600 dark:border-zinc-500 text-sm"
                        />
                        <span className="text-xs">{item.unit}</span>
                        <button
                          onClick={handleUpdateInventory}
                          className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                        >
                          {t("Save")}
                        </button>
                        <button
                          onClick={() => { setEditingInventory(null); setInventoryQty(''); }}
                          className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{item.quantity_in_stock} {item.unit}</span>
                        <button
                          onClick={() => { setEditingInventory(item); setInventoryQty(item.quantity_in_stock.toString()); }}
                          className="px-2 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600"
                        >
                          {t("Update")}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
