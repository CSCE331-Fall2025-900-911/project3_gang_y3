"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useLanguage } from "../components/LanguageProvider";
import MenuGrid from "../components/MenuGrid";
import WeatherRecommendation from "../components/WeatherRecommendation";
import VoiceOrder from "../components/VoiceOrder";

type MenuItem = { id: number | null; name: string; price: number; category?: string | null };

interface HomeClientProps {
  menuItems: MenuItem[];
  error: string | null;
  hasDbUrl: boolean;
}

// Define Rewards List
const REWARDS = [
  { name: 'Taro Milk Tea', cost: 200 },
  { name: 'Brown Sugar Boba', cost: 300 },
  { name: 'Popcorn Chicken', cost: 500 },
];

export default function HomeClient({ menuItems, error, hasDbUrl }: HomeClientProps) {
  const { t } = useLanguage();
  const [customer, setCustomer] = useState<{ id: number; name: string; firstName: string; points: number } | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', firstName: '', lastName: '', phone: '' });
  const [authError, setAuthError] = useState('');

  // Lifted Cart State
  const [cart, setCart] = useState<any[]>([]);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [quickOrders, setQuickOrders] = useState<any[]>([]);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('kiosk_customer');
    if (saved) {
      try {
        setCustomer(JSON.parse(saved));
      } catch (e) { console.error('Failed to parse customer', e); }
    }
  }, []);

  // Fetch order history and quick orders when customer changes
  useEffect(() => {
    if (!customer) {
      setOrderHistory([]);
      setQuickOrders([]);
      return;
    }

    // Fetch order history
    fetch(`/api/customer/order-history?customerId=${customer.id}`)
      .then(res => res.json())
      .then(data => setOrderHistory(data.orders || []))
      .catch(e => console.error('Failed to fetch order history', e));

    // Fetch quick orders
    fetch(`/api/customer/quick-orders?customerId=${customer.id}`)
      .then(res => res.json())
      .then(data => setQuickOrders(data.quickOrders || []))
      .catch(e => console.error('Failed to fetch quick orders', e));
  }, [customer]);

  const updateCustomerPoints = (points: number) => {
    if (!customer) return;
    const updated = { ...customer, points };
    setCustomer(updated);
    localStorage.setItem('kiosk_customer', JSON.stringify(updated));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const user = {
        id: data.customer.customer_id,
        name: `${data.customer.first_name} ${data.customer.last_name}`,
        firstName: data.customer.first_name,
        points: data.customer.points
      };
      setCustomer(user);
      localStorage.setItem('kiosk_customer', JSON.stringify(user));
      setShowLogin(false);
      setLoginForm({ username: '', password: '' });
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const user = {
        id: data.customerId,
        name: `${registerForm.firstName} ${registerForm.lastName || ''}`,
        firstName: registerForm.firstName,
        points: 0
      };
      setCustomer(user);
      localStorage.setItem('kiosk_customer', JSON.stringify(user));
      setShowRegister(false);
      setRegisterForm({ username: '', password: '', firstName: '', lastName: '', phone: '' });
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const logout = () => {
    setCustomer(null);
    localStorage.removeItem('kiosk_customer');
  };

  const redeemReward = (reward: { name: string; cost: number }) => {
    if (!customer || customer.points < reward.cost) return;

    // Find item details from menuItems to verify ID and ensure it exists
    const menuItem = menuItems.find(m => m.name.toLowerCase() === reward.name.toLowerCase());
    if (!menuItem) {
      console.error('Reward item not found in menu');
      return;
    }

    const newItem = {
      ...menuItem,
      id: menuItem.id,
      quantity: 1,
      price: 0, // Free
      pointsCost: reward.cost,
      // Default customizations for rewards (simple)
      custom: undefined
    };

    setCart(prev => [...prev, newItem]);
    // Optimistically update points? Or wait for order?
    // Plan says verify points in backend. So just add to cart.
    // But we should probably prevent using points twice in UI? 
    // To keep it simple, we just allow adding. Backend validation will fail if strict, but validation logic is yet to be added.
    // Actually, plan says "Deduct totalPointsCost from DB points." so backend handles it.
  };

  const loadQuickOrder = (quickOrder: any) => {
    try {
      // Check if items_data is already an object or needs parsing
      const items = typeof quickOrder.items_data === 'string'
        ? JSON.parse(quickOrder.items_data)
        : quickOrder.items_data;
      // Ensure each item has a quantity field
      const itemsWithQuantity = items.map((item: any) => ({
        ...item,
        quantity: item.quantity || 1
      }));
      setCart(itemsWithQuantity);
    } catch (e) {
      console.error('Failed to load quick order', e);
    }
  };

  const refreshQuickOrders = async () => {
    if (!customer) return;
    try {
      const res = await fetch(`/api/customer/quick-orders?customerId=${customer.id}`);
      const data = await res.json();
      setQuickOrders(data.quickOrders || []);
    } catch (e) {
      console.error('Failed to refresh quick orders', e);
    }
  };

  const deleteQuickOrder = async (quickOrderId: number) => {
    if (!customer) return;
    try {
      await fetch(`/api/customer/quick-orders?quickOrderId=${quickOrderId}&customerId=${customer.id}`, {
        method: 'DELETE',
      });
      setQuickOrders(prev => prev.filter(qo => qo.quick_order_id !== quickOrderId));
    } catch (e) {
      console.error('Failed to delete quick order', e);
    }
  };

  const handleVoiceOrder = (item: any) => {
    setCart(prev => [...prev, item]);
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-start bg-zinc-50 dark:bg-zinc-900 font-sans p-8 text-black dark:text-white transition-colors relative">
      {/* Voice Order Button - positioned to left of language/theme toggles */}
      <VoiceOrder menuItems={menuItems} onAddToCart={handleVoiceOrder} />

      {/* Customer Auth Header */}
      <div className="fixed top-4 left-4 z-50 w-64">
        {customer ? (
          <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gradient-to-br from-white to-gray-50 dark:from-zinc-800 dark:to-zinc-900 p-4 shadow-xl text-black dark:text-white transition-all hover:shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("Welcome back,")}</div>
                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">{customer.firstName}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("Points")}</div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">{customer.points}</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg active:scale-95 transform text-sm"
            >
              {t("Sign Out")}
            </button>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gradient-to-br from-white to-gray-50 dark:from-zinc-800 dark:to-zinc-900 p-4 shadow-xl text-black dark:text-white transition-all hover:shadow-2xl flex flex-col gap-3">
            <button
              onClick={() => setShowLogin(true)}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg active:scale-95 transform"
            >
              {t("Customer Sign In")}
            </button>
            <button
              onClick={() => setShowRegister(true)}
              className="w-full py-2 px-4 bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-400 font-semibold rounded-lg hover:bg-blue-50 dark:hover:bg-zinc-600 transition-colors shadow-md hover:shadow-lg active:scale-95 transform"
            >
              {t("Register")}
            </button>
          </div>
        )}
      </div>



      {/* Fixed Left Widget Container (Constrained Top/Bottom) */}
      <div className="fixed left-4 bottom-4 top-40 w-64 z-40 flex flex-col justify-end gap-4 pointer-events-none">

        {/* Order History Widget - Flexible Height */}
        {customer && orderHistory.length > 0 && (
          <aside className="pointer-events-auto shrink min-h-0 flex flex-col rounded-lg border border-gray-200 dark:border-gray-600 bg-gradient-to-br from-white to-gray-50 dark:from-zinc-800 dark:to-zinc-900 p-4 shadow-xl text-black dark:text-white transition-all hover:shadow-2xl">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("Recent Orders")}</h3>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1 min-h-0">
              {orderHistory.slice(0, 20).map(order => (
                <div key={order.orderId} className="bg-white dark:bg-zinc-700 rounded-lg p-3 shadow-sm border border-gray-100 dark:border-zinc-600 shrink-0">
                  <div className="flex justify-between items-start mb-2 border-b border-gray-100 dark:border-zinc-600 pb-2">
                    <div>
                      <div className="font-bold text-sm">#{order.orderId}</div>
                      <div className="text-[10px] text-gray-500">{new Date(order.date).toLocaleDateString()}</div>
                    </div>
                    <div className="font-bold text-green-600 dark:text-green-400 text-sm">
                      ${parseFloat(order.total).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 max-h-24 overflow-y-auto custom-scrollbar">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between py-0.5">
                        <span>{item.quantity}x {item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* Weather Recommendation - Fixed Height */}
        <div className="pointer-events-auto shrink-0">
          <WeatherRecommendation
            menuItems={menuItems}
            onAddToCart={(item) => setCart(prev => [...prev, item])}
          />
        </div>
      </div>
      {/* Fixed Right Widget Container - Quick Orders */}
      {customer && (
        <aside className="fixed right-6 top-20 w-80 z-50 rounded-xl border border-white/20 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md p-3 shadow-xl text-black dark:text-white transition-all card-glow flex flex-col">
          <div className="flex items-center justify-between mb-2 border-b border-gray-100 dark:border-gray-700 pb-1.5 shrink-0">
            <div className="font-bold text-base gradient-text">{t("Quick Orders")}</div>
          </div>

          <div className="overflow-y-auto custom-scrollbar pr-1" style={{ maxHeight: '200px' }}>
            {quickOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-zinc-500 dark:text-zinc-400">
                <p className="text-xs">{t('None')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {quickOrders.map(qo => (
                  <div key={qo.quick_order_id} className="p-2 bg-gray-50 dark:bg-zinc-700/50 rounded-lg border border-gray-200 dark:border-zinc-600 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex-1">
                        <div className="font-semibold text-xs">{qo.order_name}</div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400">{new Date(qo.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => loadQuickOrder(qo)}
                        className="flex-1 px-2 py-1 text-xs bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold rounded-md transition-all shadow-sm hover:shadow-md active:scale-95"
                      >
                        {t("Load")}
                      </button>
                      <button
                        onClick={() => deleteQuickOrder(qo.quick_order_id)}
                        className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white font-semibold rounded-md transition-all shadow-sm hover:shadow-md active:scale-95"
                      >
                        {t("Delete")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      )}

      <section className="w-full max-w-3xl bg-white dark:bg-zinc-800 p-8 shadow rounded text-black dark:text-white transition-colors" aria-labelledby="page-title">
        <div className="flex items-center gap-4 mb-6">
          <Image className="dark:invert" src="/assets/icon.png" alt="Kiosk logo" width={56} height={56} priority />
          <h1 id="page-title" className="text-2xl font-semibold">{t("Kiosk — Place an order")}</h1>
        </div>

        {!hasDbUrl && (
          <div className="mb-4 rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
            {t("DATABASE_URL is not set. Add a `DATABASE_URL` variable to `kiosk/.env.local` (eg. postgres://user:pass@host:port/db)")}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
            {t("Error querying database:")} {error}
          </div>
        )}

        {!error && (
          <div>
            {/* Rewards Section */}
            {customer && (
              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-700">
                <h3 className="text-lg font-bold mb-3 text-yellow-800 dark:text-yellow-200">{t("Redeem Rewards")}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {REWARDS.map(reward => {
                    const canAfford = customer.points >= reward.cost;
                    return (
                      <button
                        key={reward.name}
                        onClick={() => redeemReward(reward)}
                        disabled={!canAfford}
                        className={`p-3 rounded border text-left transition ${canAfford
                          ? 'bg-white dark:bg-zinc-800 hover:border-yellow-500 border-gray-200 dark:border-zinc-600'
                          : 'bg-gray-100 dark:bg-zinc-800/50 opacity-50 cursor-not-allowed border-transparent'
                          }`}
                      >
                        <div className="font-semibold">{reward.name}</div>
                        <div className="text-sm text-yellow-600 dark:text-yellow-400">{reward.cost} pts</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}





            {menuItems.length > 0 && (
              <div>
                <div className="mb-3 font-medium">{t("Menu")}</div>
                <MenuGrid items={menuItems} customerId={customer?.id} cartState={[cart, setCart]} onPointsUpdate={updateCustomerPoints} onQuickOrderSaved={refreshQuickOrders} />
              </div>
            )}
          </div>
        )}
      </section>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-800 p-6 rounded shadow-lg w-full max-w-sm relative">
            <button onClick={() => setShowLogin(false)} className="absolute top-2 right-2 text-xl">&times;</button>
            <h2 className="text-xl font-bold mb-4">{t("Customer Sign In")}</h2>
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <input
                type="text" placeholder={t("Username")}
                className="p-2 border rounded dark:bg-zinc-700 dark:border-zinc-600"
                value={loginForm.username} onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
              />
              <input
                type="password" placeholder={t("Password")}
                className="p-2 border rounded dark:bg-zinc-700 dark:border-zinc-600"
                value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
              />
              {authError && <div className="text-red-500 text-sm">{authError}</div>}
              <button type="submit" className="bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">{t("Sign In")}</button>
            </form>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-800 p-6 rounded shadow-lg w-full max-w-sm relative">
            <button onClick={() => setShowRegister(false)} className="absolute top-2 right-2 text-xl">&times;</button>
            <h2 className="text-xl font-bold mb-4">{t("Create Account")}</h2>
            <form onSubmit={handleRegister} className="flex flex-col gap-3">
              <input
                type="text" placeholder={t("Username")} required
                className="p-2 border rounded dark:bg-zinc-700 dark:border-zinc-600"
                value={registerForm.username} onChange={e => setRegisterForm({ ...registerForm, username: e.target.value })}
              />
              <input
                type="password" placeholder={t("Password")} required
                className="p-2 border rounded dark:bg-zinc-700 dark:border-zinc-600"
                value={registerForm.password} onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
              />
              <input
                type="text" placeholder={t("First Name")} required
                className="p-2 border rounded dark:bg-zinc-700 dark:border-zinc-600"
                value={registerForm.firstName} onChange={e => setRegisterForm({ ...registerForm, firstName: e.target.value })}
              />
              <input
                type="text" placeholder={t("Last Name")}
                className="p-2 border rounded dark:bg-zinc-700 dark:border-zinc-600"
                value={registerForm.lastName} onChange={e => setRegisterForm({ ...registerForm, lastName: e.target.value })}
              />
              <input
                type="tel" placeholder={t("Phone Number")}
                className="p-2 border rounded dark:bg-zinc-700 dark:border-zinc-600"
                value={registerForm.phone} onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })}
              />
              {authError && <div className="text-red-500 text-sm">{authError}</div>}
              <button type="submit" className="bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700">{t("Register")}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
