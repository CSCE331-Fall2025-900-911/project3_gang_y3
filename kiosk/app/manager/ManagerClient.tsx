"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from "next/image";
import { useLanguage } from '../../components/LanguageProvider';
import { useAuth } from '../../lib/useAuth';
import { signOut } from 'next-auth/react';
import type { InventoryItem, BestSeller, SalesData, RecentOrder, MenuItem, PaymentBreakdown, Staff } from '../../lib/managerData';

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
    paymentBreakdown: PaymentBreakdown;
    staff: Staff[];
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
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RecentOrder | null>(null);

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
  const { inventory, bestSeller, salesData, recentOrders, totalOrdersToday, lowStockItems, menuItems, categories, paymentBreakdown, staff: initialStaff } = initialData;

  // State for staff management
  const [staffList, setStaffList] = useState<Staff[]>(initialStaff || []);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'Cashier' | 'Manager'>('Cashier');

  // State for X-Report chart metric
  const [chartMetric, setChartMetric] = useState<'sales' | 'voids' | 'cash' | 'card'>('sales');

  // State for chat widget
  const [chatMessages, setChatMessages] = useState<Array<{ type: 'user' | 'bot'; text: string }>>([
    { type: 'bot', text: 'Hi! Ask me anything about your business data. Try "What are today\'s total sales?" or "Any low stock items?"' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

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

  const handleVoidOrder = async () => {
    if (!selectedOrder) return;
    try {
      const res = await fetch('/api/manager/void-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: selectedOrder.id })
      });
      if (res.ok) {
        setShowVoidModal(false);
        setSelectedOrder(null);
        router.refresh();
      }
    } catch (error) {
      console.error('Error voiding order:', error);
    }
  };

  // Staff Management Handlers
  const handleAddStaff = async () => {
    if (!newStaffName) return;
    try {
      const res = await fetch('/api/manager/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newStaffName,
          email: newStaffEmail,
          role: newStaffRole
        })
      });
      if (res.ok) {
        const data = await res.json();
        setStaffList([...staffList, data.staff]);
        setShowAddStaff(false);
        setNewStaffName('');
        setNewStaffEmail('');
        setNewStaffRole('Cashier');
      }
    } catch (error) {
      console.error('Error adding staff:', error);
    }
  };

  const handleUpdateStaffRole = async (userId: number, newRole: 'Cashier' | 'Manager') => {
    try {
      const res = await fetch('/api/manager/staff', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      });
      if (res.ok) {
        setStaffList(staffList.map(s =>
          s.user_id === userId ? { ...s, role: newRole } : s
        ));
      }
    } catch (error) {
      console.error('Error updating staff:', error);
    }
  };

  const handleRemoveStaff = async (userId: number) => {
    try {
      const res = await fetch('/api/manager/staff', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        setStaffList(staffList.filter(s => s.user_id !== userId));
      }
    } catch (error) {
      console.error('Error removing staff:', error);
    }
  };

  // Chat handler
  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/manager/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage })
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { type: 'bot', text: data.answer }]);
      } else {
        setChatMessages(prev => [...prev, { type: 'bot', text: 'Sorry, I couldn\'t process that request.' }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { type: 'bot', text: 'Connection error. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 font-sans p-8 text-black dark:text-white transition-colors">
      <div className="fixed top-4 right-48 z-50 flex gap-4">
        <button
          onClick={handleRefresh}
          className="px-4 py-3 rounded-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold transition-colors shadow-lg"
        >
          {t("Refresh")}
        </button>
        <button
          onClick={() => router.push('/menu-selector')}
          className="px-4 py-3 rounded-full bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-semibold transition-colors shadow-lg"
        >
          {t("Back to Dashboard")}
        </button>
      </div>
      <div className="max-w-7xl mx-auto">

        {/* Title */}
        <div className="flex items-center gap-4 mb-6">
          <Image className="dark:invert" src="/assets/icon.png" alt="Logo" width={40} height={40} priority />
          <h1 className="text-2xl font-semibold">{t("Manager Dashboard")}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Product Usage Chart Widget */}
          <div className="bg-white dark:bg-zinc-800 p-6 rounded shadow flex flex-col gap-4" style={{ minHeight: '400px' }}>
            <h2 className="text-xl font-semibold mb-2">{t("Product Usage Chart")}</h2>
            <div className="mb-1 text-sm text-gray-600 dark:text-gray-300">{t("Select a time window to view inventory usage.")}</div>
            <div className="flex flex-col gap-2 mb-2 w-full max-w-xs">
              <label className="text-xs font-medium">{t("Start Date & Time")}</label>
              <input type="datetime-local" value={usageStart} onChange={e => setUsageStart(e.target.value)} className="px-2 py-1 rounded border w-full" />
              <label className="text-xs font-medium">{t("End Date & Time")}</label>
              <input type="datetime-local" value={usageEnd} onChange={e => setUsageEnd(e.target.value)} className="px-2 py-1 rounded border w-full" />
              <button className="mt-2 px-3 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors" onClick={fetchUsageData} disabled={loadingUsage || !usageStart || !usageEnd}>{t("Generate Usage Table")}</button>
            </div>
            {loadingUsage ? (
              <div className="text-center py-8">{t("Loading...")}</div>
            ) : usageData.length > 0 ? (
              <div className="overflow-y-auto max-h-56 border rounded">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-100 dark:bg-zinc-700">
                    <tr>
                      <th className="p-2 text-left">{t("Inventory Item")}</th>
                      <th className="p-2 text-left">{t("Amount Used")}</th>
                      <th className="p-2 text-left">{t("Unit")}</th>
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
              <div className="text-center py-8 text-gray-500">{t("No usage data for selected period.")}</div>
            )}
          </div>
          {/* X-Report Widget */}
          <div className="bg-white dark:bg-zinc-800 p-6 rounded shadow xl:col-span-2">
            <h2 className="text-xl font-semibold mb-4">{t("X-Report")}</h2>
            <div className="mb-2 text-sm text-gray-600 dark:text-gray-300">{t("Sales activities per hour for today")}</div>

            {/* Hourly Data Line Graph */}
            <div className="mb-4 p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200">{t("Hourly Data Today")}</h3>
                <select
                  value={chartMetric}
                  onChange={(e) => setChartMetric(e.target.value as 'sales' | 'voids' | 'cash' | 'card')}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm font-medium"
                >
                  <option value="sales">{t("Sales")}</option>
                  <option value="voids">{t("Voids")}</option>
                  <option value="cash">{t("Cash")}</option>
                  <option value="card">{t("Card")}</option>
                </select>
              </div>
              <div className="relative">
                {(() => {
                  const hourlyData = salesData?.hourly || [];
                  const getMetricValue = (h: typeof hourlyData[0]) => h[chartMetric] as number;
                  const maxValue = Math.max(...hourlyData.map(h => getMetricValue(h)), 1);
                  const colors: Record<string, { line: string; fill: string }> = {
                    sales: { line: '#3b82f6', fill: '#3b82f6' },
                    voids: { line: '#ef4444', fill: '#ef4444' },
                    cash: { line: '#22c55e', fill: '#22c55e' },
                    card: { line: '#8b5cf6', fill: '#8b5cf6' }
                  };
                  const color = colors[chartMetric];

                  return (
                    <svg viewBox="0 0 500 180" className="w-full h-48">
                      {/* Background gradient */}
                      <defs>
                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={color.fill} stopOpacity="0.3" />
                          <stop offset="100%" stopColor={color.fill} stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Grid lines */}
                      {[0, 1, 2, 3, 4].map(i => (
                        <line key={i} x1="45" y1={25 + i * 32} x2="490" y2={25 + i * 32} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />
                      ))}

                      {/* Y-axis labels */}
                      {[maxValue, Math.round(maxValue * 0.75), Math.round(maxValue * 0.5), Math.round(maxValue * 0.25), 0].map((val, i) => (
                        <text key={i} x="40" y={30 + i * 32} textAnchor="end" className="text-xs fill-gray-500">{val}</text>
                      ))}

                      {/* X-axis labels (hours) */}
                      {hourlyData.map((row, i) => {
                        const x = 55 + i * (435 / Math.max(hourlyData.length - 1, 1));
                        return (
                          <text key={row.hour} x={x} y="170" textAnchor="middle" className="text-xs fill-gray-500">
                            {row.hour > 12 ? `${row.hour - 12}p` : row.hour === 12 ? '12p' : `${row.hour}a`}
                          </text>
                        );
                      })}

                      {/* Area fill under line */}
                      {(() => {
                        const points = hourlyData.map((h, i) => {
                          const x = 55 + i * (435 / Math.max(hourlyData.length - 1, 1));
                          const y = 153 - (getMetricValue(h) / maxValue) * 128;
                          return `${x},${y}`;
                        });
                        const firstX = 55;
                        const lastX = 55 + (hourlyData.length - 1) * (435 / Math.max(hourlyData.length - 1, 1));
                        return (
                          <polygon
                            points={`${firstX},153 ${points.join(' ')} ${lastX},153`}
                            fill="url(#chartGradient)"
                          />
                        );
                      })()}

                      {/* Data line */}
                      {(() => {
                        const points = hourlyData.map((h, i) => {
                          const x = 55 + i * (435 / Math.max(hourlyData.length - 1, 1));
                          const y = 153 - (getMetricValue(h) / maxValue) * 128;
                          return `${x},${y}`;
                        }).join(' ');
                        return <polyline points={points} fill="none" stroke={color.line} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />;
                      })()}

                      {/* Data points */}
                      {hourlyData.map((h, i) => {
                        const x = 55 + i * (435 / Math.max(hourlyData.length - 1, 1));
                        const y = 153 - (getMetricValue(h) / maxValue) * 128;
                        return (
                          <circle key={i} cx={x} cy={y} r="4" fill={color.line} stroke="white" strokeWidth="2" />
                        );
                      })}
                    </svg>
                  );
                })()}
              </div>
            </div>

            {/* Payment Breakdown Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{paymentBreakdown.cash.count}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{t("Cash Orders")}</div>
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">${paymentBreakdown.cash.total.toFixed(2)}</div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{paymentBreakdown.card.count}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{t("Card Orders")}</div>
                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">${paymentBreakdown.card.total.toFixed(2)}</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{totalOrdersToday}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{t("Total Orders")}</div>
                <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">${salesData?.today.toFixed(2)}</div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {(() => {
                    const total = paymentBreakdown.cash.count + paymentBreakdown.card.count;
                    return total > 0 ? Math.round((paymentBreakdown.card.count / total) * 100) : 0;
                  })()}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{t("Card Usage")}</div>
                <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                  {(() => {
                    const total = paymentBreakdown.cash.count + paymentBreakdown.card.count;
                    return total > 0 ? Math.round((paymentBreakdown.cash.count / total) * 100) : 0;
                  })()}% {t("Cash")}
                </div>
              </div>
            </div>
          </div>

          {/* Z-Report Widget */}
          <div className="bg-white dark:bg-zinc-800 p-6 rounded shadow xl:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">{t("Z-Report")}</h2>
                <div className="text-sm text-gray-600 dark:text-gray-300">{t("End-of-day summary and reset")}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">{t("Report Date")}</div>
                <div className="font-semibold">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">${salesData?.today.toFixed(2)}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{t("Gross Sales")}</div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totalOrdersToday}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{t("Total Orders")}</div>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {salesData?.hourly?.reduce((sum, h) => sum + h.voids, 0) || 0}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{t("Voided Orders")}</div>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  ${totalOrdersToday > 0 ? (salesData?.today / totalOrdersToday).toFixed(2) : '0.00'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{t("Avg Order Value")}</div>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Payment Breakdown */}
              <div className="p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-lg">
                <h4 className="font-semibold mb-3 text-sm">{t("Payment Breakdown")}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-sm">{t("Cash")}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">${paymentBreakdown.cash.total.toFixed(2)}</span>
                      <span className="text-xs text-gray-500 ml-2">({paymentBreakdown.cash.count} {t("orders")})</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span className="text-sm">{t("Card")}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">${paymentBreakdown.card.total.toFixed(2)}</span>
                      <span className="text-xs text-gray-500 ml-2">({paymentBreakdown.card.count} {t("orders")})</span>
                    </div>
                  </div>
                  <hr className="border-gray-200 dark:border-zinc-600 my-2" />
                  <div className="flex justify-between items-center font-semibold">
                    <span>{t("Total")}</span>
                    <span>${(paymentBreakdown.cash.total + paymentBreakdown.card.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Inventory Alerts */}
              <div className="p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-lg">
                <h4 className="font-semibold mb-3 text-sm">{t("Inventory Status")}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t("Out of Stock Items")}</span>
                    <span className={`font-semibold ${menuItems.filter(item => item.availability === false).length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {menuItems.filter(item => item.availability === false).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t("Low Stock Items")}</span>
                    <span className={`font-semibold ${redThresholdCount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {redThresholdCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t("Inventory Updates Today")}</span>
                    <span className="font-semibold">{inventoryUpdateCount}</span>
                  </div>
                </div>
                {lowStockItems.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-zinc-600">
                    <div className="text-xs text-gray-500 mb-1">{t("Low Stock Items")}:</div>
                    <div className="text-xs space-y-0.5">
                      {lowStockItems.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="text-orange-600 dark:text-orange-400">
                          {item.item_name}: {item.quantity_in_stock} {item.unit}
                        </div>
                      ))}
                      {lowStockItems.length > 3 && (
                        <div className="text-gray-500">+{lowStockItems.length - 3} {t("more...")}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Run Z-Report Button */}
            <button
              className="w-full py-3 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold transition-all shadow-lg hover:shadow-xl"
              onClick={handleRunZReport}
            >
              {t("Run Z-Report")}
            </button>

            {/* Z-Report Modal */}
            {showZReportModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50 dark:bg-black/70" onClick={() => setShowZReportModal(false)}></div>
                <div className="relative z-10 w-[95%] max-w-2xl rounded-xl bg-white dark:bg-zinc-800 shadow-2xl text-black dark:text-white overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 text-white">
                    <h3 className="text-xl font-bold">{t("End of Day Z-Report")}</h3>
                    <p className="text-sm opacity-90">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>

                  <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {/* Financial Summary */}
                    <div className="mb-6">
                      <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-200">{t("Financial Summary")}</h4>
                      <div className="bg-gray-50 dark:bg-zinc-700/50 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">${salesData?.today.toFixed(2)}</div>
                            <div className="text-sm text-gray-500">{t("Gross Sales")}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold">{totalOrdersToday}</div>
                            <div className="text-sm text-gray-500">{t("Orders Processed")}</div>
                          </div>
                        </div>
                        <hr className="my-4 border-gray-200 dark:border-zinc-600" />
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>{t("Cash Payments")}</span>
                            <span className="font-semibold">${paymentBreakdown.cash.total.toFixed(2)} ({paymentBreakdown.cash.count})</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t("Card Payments")}</span>
                            <span className="font-semibold">${paymentBreakdown.card.total.toFixed(2)} ({paymentBreakdown.card.count})</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t("Voided Orders")}</span>
                            <span className="font-semibold text-red-600">{salesData?.hourly?.reduce((sum, h) => sum + h.voids, 0) || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Inventory Status */}
                    <div className="mb-6">
                      <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-200">{t("Inventory Status")}</h4>
                      <div className="bg-gray-50 dark:bg-zinc-700/50 rounded-lg p-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className={`text-2xl font-bold ${menuItems.filter(item => item.availability === false).length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {menuItems.filter(item => item.availability === false).length}
                            </div>
                            <div className="text-xs text-gray-500">{t("Out of Stock")}</div>
                          </div>
                          <div>
                            <div className={`text-2xl font-bold ${redThresholdCount > 0 ? 'text-orange-600' : 'text-green-600'}`}>{redThresholdCount}</div>
                            <div className="text-xs text-gray-500">{t("Low Stock")}</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold">{inventoryUpdateCount}</div>
                            <div className="text-xs text-gray-500">{t("Updates Today")}</div>
                          </div>
                        </div>
                        {lowStockItems.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-600">
                            <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">Low Stock Items:</div>
                            <div className="grid grid-cols-2 gap-1 text-xs">
                              {lowStockItems.map((item, idx) => (
                                <div key={idx} className="text-orange-600 dark:text-orange-400">
                                  • {item.item_name}: {item.quantity_in_stock} {item.unit}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Best Seller */}
                    <div className="mb-6">
                      <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-200">{t("Top Performer")}</h4>
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-4 text-center">
                        <div className="text-lg font-bold">{bestSeller.name}</div>
                        <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{bestSeller.sales} {t("sold")}</div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="border-t border-gray-200 dark:border-zinc-700 p-4 bg-gray-50 dark:bg-zinc-700/50 flex justify-between items-center">
                    <button
                      className="px-6 py-2 rounded-lg border border-gray-300 dark:border-zinc-600 hover:bg-gray-100 dark:hover:bg-zinc-700 font-medium transition-colors"
                      onClick={() => setShowZReportModal(false)}
                    >
                      {t("Cancel")}
                    </button>
                    <button
                      className="px-6 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold transition-all shadow-lg"
                      onClick={handleConfirmZReport}
                    >
                      ✓ {t("Confirm & Close Day")}
                    </button>
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
                recentOrders.map((order) => {
                  const isVoided = order.orderStatus === 'Voided';
                  return (
                    <div
                      key={order.id}
                      onClick={() => {
                        if (!isVoided) {
                          setSelectedOrder(order);
                          setShowVoidModal(true);
                        }
                      }}
                      className={`flex items-center justify-between p-3 rounded ${isVoided
                        ? 'bg-gray-200 dark:bg-zinc-600 opacity-60 cursor-not-allowed'
                        : 'bg-gray-50 dark:bg-zinc-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-600 transition-colors'
                        }`}
                    >
                      <div className="flex-1">
                        <div className={`font-medium ${isVoided ? 'line-through' : ''}`}>
                          {t("Order")} #{order.id}
                          {isVoided && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
                              VOIDED
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          {order.time} • {order.items} {t("items")} • {order.paymentMethod}
                        </div>
                      </div>
                      <div className={`font-semibold ${isVoided ? 'text-gray-500' : 'text-green-600 dark:text-green-400'}`}>
                        ${order.total.toFixed(2)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-gray-500">{t("No orders today")}</div>
              )}
            </div>
          </div>

          {/* Void Order Confirmation Modal */}
          {showVoidModal && selectedOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={() => setShowVoidModal(false)}></div>
              <div className="relative z-10 w-[90%] max-w-md rounded bg-white dark:bg-zinc-800 p-6 shadow-lg text-black dark:text-white transition-colors">
                <h3 className="text-lg font-semibold mb-3">Void Order #{selectedOrder.id}?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Are you sure you want to void this order? This action cannot be undone.
                </p>
                <div className="bg-gray-50 dark:bg-zinc-700 p-3 rounded mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Order ID:</span>
                    <span className="font-medium">#{selectedOrder.id}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Time:</span>
                    <span className="font-medium">{selectedOrder.time}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Items:</span>
                    <span className="font-medium">{selectedOrder.items}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Payment:</span>
                    <span className="font-medium">{selectedOrder.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total:</span>
                    <span className="font-medium">${selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowVoidModal(false)}
                    className="px-4 py-2 rounded border border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVoidOrder}
                    className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors"
                  >
                    Void Order
                  </button>
                </div>
              </div>
            </div>
          )}

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
            <div className="space-y-3 max-h-48 overflow-y-auto">
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
                <div className="text-sm text-gray-500 p-6 bg-green-50 dark:bg-green-900/30 rounded text-center">
                  {t("All items well stocked")}
                </div>
              )}
            </div>
          </div>

          {/* Peak Hours Widget */}
          <div className="bg-white dark:bg-zinc-800 p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">{t("Peak Hours")}</h2>
            <div className="space-y-2">
              {(() => {
                const hourlyData = salesData?.hourly || [];
                const sorted = [...hourlyData].sort((a, b) => b.sales - a.sales).slice(0, 4);
                if (sorted.length === 0 || sorted[0].sales === 0) {
                  return <div className="text-sm text-gray-500 text-center p-4">{t("No data yet")}</div>;
                }
                const maxSales = sorted[0].sales;
                return sorted.map((h, idx) => {
                  const displayHour = h.hour > 12 ? `${h.hour - 12}pm` : h.hour === 12 ? '12pm' : `${h.hour}am`;
                  const percentage = (h.sales / maxSales) * 100;
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="w-12 text-sm font-medium">{displayHour}</span>
                      <div className="flex-1 h-6 bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="w-8 text-sm font-semibold text-right">{h.sales}</span>
                    </div>
                  );
                });
              })()}
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

          {/* Staff Management Widget */}
          <div className="bg-white dark:bg-zinc-800 p-6 rounded shadow xl:col-span-3 lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{t("Staff Management")}</h2>
              <button
                onClick={() => setShowAddStaff(!showAddStaff)}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              >
                {showAddStaff ? t("Cancel") : t("+ Add Staff")}
              </button>
            </div>

            {/* Add New Staff Form */}
            {showAddStaff && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 rounded">
                <h3 className="font-medium mb-3">{t("Add New Staff Member")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder={t("Username")}
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="px-3 py-2 rounded border dark:bg-zinc-600 dark:border-zinc-500"
                  />
                  <input
                    type="email"
                    placeholder={t("Email (optional)")}
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    className="px-3 py-2 rounded border dark:bg-zinc-600 dark:border-zinc-500"
                  />
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as 'Cashier' | 'Manager')}
                    className="px-3 py-2 rounded border dark:bg-zinc-600 dark:border-zinc-500"
                  >
                    <option value="Cashier">Cashier</option>
                    <option value="Manager">Manager</option>
                  </select>
                  <button
                    onClick={handleAddStaff}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    {t("Add Staff")}
                  </button>
                </div>
              </div>
            )}

            {/* Staff List */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 dark:bg-zinc-700">
                    <th className="p-3 text-left">{t("Username")}</th>
                    <th className="p-3 text-left">{t("Email")}</th>
                    <th className="p-3 text-left">{t("Role")}</th>
                    <th className="p-3 text-right">{t("Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.length > 0 ? (
                    staffList.map((member) => (
                      <tr key={member.user_id} className="border-b border-gray-200 dark:border-zinc-700">
                        <td className="p-3 font-medium">{member.username}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">{member.email || '—'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${member.role === 'Manager'
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            }`}>
                            {member.role}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleUpdateStaffRole(
                                member.user_id,
                                member.role === 'Manager' ? 'Cashier' : 'Manager'
                              )}
                              className="px-2 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600"
                            >
                              {member.role === 'Manager' ? t("Make Cashier") : t("Make Manager")}
                            </button>
                            <button
                              onClick={() => handleRemoveStaff(member.user_id)}
                              className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                            >
                              {t("Remove")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-gray-500">
                        {t("No staff members found")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Data Chat Widget */}
          <div className="bg-white dark:bg-zinc-800 p-6 rounded shadow xl:col-span-3 lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">{t("Data Assistant")}</h2>

            {/* Chat Messages */}
            <div className="h-64 overflow-y-auto mb-4 p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-lg space-y-3">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.type === 'user'
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-white dark:bg-zinc-600 text-gray-800 dark:text-gray-100 rounded-bl-none shadow'
                      }`}
                  >
                    {msg.text.split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-zinc-600 p-3 rounded-lg rounded-bl-none shadow">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder={t("Ask about sales, orders, inventory...")}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={chatLoading}
              />
              <button
                onClick={handleSendChat}
                disabled={chatLoading || !chatInput.trim()}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
              >
                {t("Send")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}
