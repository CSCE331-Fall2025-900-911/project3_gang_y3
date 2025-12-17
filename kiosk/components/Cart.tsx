"use client";
import React, { useState } from 'react';
import { useLanguage } from './LanguageProvider';
import { translateMenuItem } from '../lib/translations';
import { TOPPINGS } from '../lib/toppings';

type Item = { id: number | null; name: string; price: number };
type CartItem = Item & { quantity: number; pointsCost?: number; custom?: { size: 'regular' | 'large'; temperature: 'hot' | 'cold'; ice: 'low' | 'medium' | 'high'; sugar: 'low' | 'medium' | 'high'; toppings?: number[] } };

export default function Cart({ items, customerId, onClear, onRemove, onUpdateQuantity, onPointsUpdate, onQuickOrderSaved }: { items: CartItem[]; customerId?: number; onClear: () => void; onRemove?: (index: number) => void; onUpdateQuantity?: (index: number, delta: number) => void; onPointsUpdate?: (points: number) => void; onQuickOrderSaved?: () => void }) {
  const { t, language } = useLanguage();
  const [isPlacing, setIsPlacing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);
  const [saveAsQuickOrder, setSaveAsQuickOrder] = useState(false);
  const [quickOrderName, setQuickOrderName] = useState('');
  const [pendingItems, setPendingItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card'>('Cash');

  const total = items.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);

  const placeOrder = async () => {
    if (items.length === 0) {
      setMessage({ type: 'error', text: t('Cart is empty') });
      return;
    }

    setIsPlacing(true);
    setMessage(null);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items, customerId, paymentMethod }),
      });

      const data = await response.json();

      if (data.success) {
        setPendingOrderId(data.orderId);
        setPendingItems([...items]); // Save items for quick order
        setShowEmailPopup(true);

        // Fetch updated customer points if customerId exists
        if (customerId && onPointsUpdate) {
          try {
            const custRes = await fetch('/api/customer/points', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ customerId }),
            });
            const custData = await custRes.json();
            if (custData.points !== undefined) {
              onPointsUpdate(custData.points);
            }
          } catch (e) {
            console.error('Failed to fetch updated points', e);
          }
        }
      } else {
        setMessage({ type: 'error', text: data.error || t('Failed to place order') });
      }
    } catch {
      setMessage({ type: 'error', text: t('Failed to connect to server') });
    } finally {
      setIsPlacing(false);
    }
  };

  const saveQuickOrder = async () => {
    if (!customerId || !saveAsQuickOrder || !quickOrderName.trim()) return;

    try {
      await fetch('/api/customer/quick-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          orderName: quickOrderName,
          items: pendingItems
        }),
      });

      // Trigger refresh of quick orders list
      if (onQuickOrderSaved) {
        onQuickOrderSaved();
      }
    } catch (e) {
      console.error('Failed to save quick order', e);
    }
  };

  const handleEmailSubmit = async () => {
    try {
      // Send receipt via API
      const response = await fetch('/api/send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customerEmail,
          orderId: pendingOrderId,
          items: pendingItems,
          total: total
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: `${t('Order')} #${pendingOrderId} ${t('placed successfully!')} ${t('Receipt sent to')} ${customerEmail}` });
      } else {
        setMessage({ type: 'success', text: `${t('Order')} #${pendingOrderId} ${t('placed successfully!')} (${t('Failed to send receipt')})` });
      }
    } catch {
      setMessage({ type: 'success', text: `${t('Order')} #${pendingOrderId} ${t('placed successfully!')} (${t('Failed to send receipt')})` });
    }

    // Save quick order if requested
    await saveQuickOrder();

    setShowEmailPopup(false);
    setCustomerEmail('');
    setPendingOrderId(null);
    setSaveAsQuickOrder(false);
    setQuickOrderName('');
    setPendingItems([]);

    setTimeout(() => {
      onClear();
      setMessage(null);
    }, 3000);
  };

  const handleSkipEmail = async () => {
    // Save quick order if requested
    await saveQuickOrder();

    setMessage({ type: 'success', text: `${t('Order')} #${pendingOrderId} ${t('placed successfully!')}` });
    setShowEmailPopup(false);
    setCustomerEmail('');
    setPendingOrderId(null);
    setSaveAsQuickOrder(false);
    setQuickOrderName('');
    setPendingItems([]);

    setTimeout(() => {
      onClear();
      setMessage(null);
    }, 2000);
  };

  return (
    <>
      <div className="fixed right-6 bottom-6 w-80 z-50 rounded-2xl border border-white/20 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md shadow-xl text-black dark:text-white transition-all card-glow flex flex-col max-h-[calc(100vh-420px)]">
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div className="font-bold text-lg gradient-text">{t('Your Order')}</div>
          <button
            className="text-sm px-3 py-1 rounded-full bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors"
            onClick={onClear}
          >
            {t('Clear')}
          </button>
        </div>

        {/* Scrollable Items */}
        <div className="overflow-y-auto custom-scrollbar px-4 flex-1 min-h-0">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-zinc-500 dark:text-zinc-400">
              <p className="text-sm">{t('Your cart is empty')}</p>
              <p className="text-xs mt-1 opacity-70">{t('Time to add some boba!')}</p>
            </div>
          ) : (
            items.map((it, idx) => (
              <div key={`${it.id ?? it.name}-${idx}`} className="py-2 text-sm text-black dark:text-white group border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50/50 dark:hover:bg-zinc-700/50 rounded-lg px-1 transition-colors">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="font-medium flex-1 text-sm">{translateMenuItem(it.name, language)}</div>
                  <div className="font-semibold text-primary dark:text-primary-light">${((it.price || 0) * it.quantity).toFixed(2)}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 rounded-full px-2 py-0.5 border border-gray-100 dark:border-zinc-700">
                    {onUpdateQuantity && (
                      <>
                        <button
                          onClick={() => onUpdateQuantity(idx, -1)}
                          className="w-6 h-6 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-600 flex items-center justify-center text-sm font-medium transition-colors"
                        >
                          −
                        </button>
                        <span className="text-sm font-medium w-6 text-center">{it.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(idx, 1)}
                          className="w-6 h-6 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-600 flex items-center justify-center text-sm font-medium transition-colors"
                        >
                          +
                        </button>
                      </>
                    )}
                    {!onUpdateQuantity && <span className="text-xs text-gray-500">×{it.quantity}</span>}
                  </div>
                  {onRemove && (
                    <button
                      onClick={() => onRemove(idx)}
                      className="w-6 h-6 rounded-full bg-transparent hover:bg-red-50 dark:hover:bg-red-900/30 text-zinc-400 hover:text-red-500 dark:hover:text-red-300 flex items-center justify-center transition-all"
                      aria-label="Remove item"
                    >
                      ×
                    </button>
                  )}
                </div>
                {it.custom && (
                  <div className="mt-2 text-xs p-2 rounded bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30 text-zinc-600 dark:text-zinc-300">
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <span><span className="opacity-70">{t('Size')}:</span> {t(it.custom.size)}</span>
                      {it.custom.temperature && <span><span className="opacity-70">{t('Temp')}:</span> {t(it.custom.temperature)}</span>}
                      {it.custom.ice && <span><span className="opacity-70">{t('Ice')}:</span> {t(it.custom.ice)}</span>}
                      {it.custom.sugar && <span><span className="opacity-70">{t('Sugar')}:</span> {t(it.custom.sugar)}</span>}
                    </div>
                    {it.custom.toppings && it.custom.toppings.length > 0 && (
                      <div className="mt-1 pt-1 border-t border-purple-100 dark:border-purple-800/30">
                        <span className="opacity-70">{t('Toppings')}:</span> {it.custom.toppings.map(id => TOPPINGS.find(t => t.id === id)?.name).filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer with Total, Payment, and Place Order - Fixed at bottom */}
        <div className="px-4 pb-4 shrink-0">
          {items.length > 0 && (
            <div className="mt-2 pt-2 border-t-2 border-dashed border-gray-200 dark:border-zinc-700">
              <div className="flex items-center justify-between text-base font-bold">
                <div className="text-sm">{t('Total')}</div>
                <div className="gradient-text text-xl">${total.toFixed(2)}</div>
              </div>
            </div>
          )}

          {message && (
            <div className={`mt-2 p-2 rounded-lg text-xs flex items-center gap-2 ${message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
              : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
              }`}>
              {message.type === 'success' ? '✅' : ''} {message.text}
            </div>
          )}

          <div className="mt-2">
            {items.length > 0 && (
              <div className="mb-2 bg-gray-50 dark:bg-zinc-800/50 p-2 rounded-lg border border-gray-100 dark:border-zinc-700">
                <div className="text-xs font-semibold mb-1.5">
                  {t('Payment Method')}
                </div>
                <div className="flex gap-2">
                  <label className={`flex-1 flex items-center justify-center gap-1 p-1.5 rounded cursor-pointer border transition-all text-xs ${paymentMethod === 'Cash'
                    ? 'bg-white dark:bg-zinc-700 border-primary shadow-sm ring-1 ring-primary font-semibold'
                    : 'hover:bg-white dark:hover:bg-zinc-700 border-transparent hover:border-gray-200'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Cash"
                      checked={paymentMethod === 'Cash'}
                      onChange={() => setPaymentMethod('Cash')}
                      className="hidden"
                    />
                    <span>{t('Cash')}</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-1 p-1.5 rounded cursor-pointer border transition-all text-xs ${paymentMethod === 'Card'
                    ? 'bg-white dark:bg-zinc-700 border-primary shadow-sm ring-1 ring-primary font-semibold'
                    : 'hover:bg-white dark:hover:bg-zinc-700 border-transparent hover:border-gray-200'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Card"
                      checked={paymentMethod === 'Card'}
                      onChange={() => setPaymentMethod('Card')}
                      className="hidden"
                    />
                    <span>{t('Card')}</span>
                  </label>
                </div>
              </div>
            )}

            <button
              className="w-full rounded-xl bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white font-bold py-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-primary/30 active:scale-95 flex items-center justify-center gap-2 text-sm"
              onClick={placeOrder}
              disabled={isPlacing || items.length === 0}
            >
              {isPlacing ? (
                <div className="loading-boba">
                  <span></span><span></span><span></span>
                  {t('Brewing...')}
                </div>
              ) : (
                <>
                  {t('Place Order')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Email Receipt Popup - Now outside Cart container */}
      {showEmailPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="absolute inset-0 bg-black/40" onClick={handleSkipEmail}></div>
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-8 shadow-2xl text-black dark:text-white border border-white/20 animation-float">


            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/50 dark:to-emerald-800/50 flex items-center justify-center shadow-inner">
                <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold gradient-text mb-1">{t('Order Placed!')}</h2>
              <div className="inline-block px-3 py-1 bg-gray-100 dark:bg-zinc-800 rounded-full text-sm font-mono text-gray-500 dark:text-gray-400">#{pendingOrderId}</div>
              <p className="text-gray-600 dark:text-gray-300 mt-3">{t('Your delicious drinks are being prepared.')}</p>
            </div>

            <div className="mb-6 bg-gray-50/50 dark:bg-zinc-800/50 p-4 rounded-xl border border-gray-100 dark:border-zinc-700">
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">
                {t('Get your receipt')}
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder={t('Enter your email address')}
                className="w-full px-4 py-3 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            {customerId && (
              <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={saveAsQuickOrder}
                      onChange={(e) => setSaveAsQuickOrder(e.target.checked)}
                      className="w-5 h-5 rounded text-primary focus:ring-primary border-gray-300"
                    />
                  </div>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{t('Save as Quick Order')}</span>
                </label>

                {saveAsQuickOrder && (
                  <div className="mt-3 pl-8">
                    <input
                      type="text"
                      value={quickOrderName}
                      onChange={(e) => setQuickOrderName(e.target.value)}
                      placeholder={t('Name (e.g., "Monday Boost")')}
                      className="w-full px-3 py-2 border border-yellow-200/50 dark:border-yellow-700/50 rounded-lg bg-white/80 dark:bg-zinc-800/80 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSkipEmail}
                className="flex-1 px-4 py-3 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-300 font-medium transition-all"
              >
                {t('Skip')}
              </button>
              <button
                onClick={handleEmailSubmit}
                disabled={!customerEmail || !customerEmail.includes('@')}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg hover:shadow-primary/30 transition-all transform active:scale-95"
              >
                {t('Send & Done')}
              </button>
            </div>
          </div>
        </div>
      )
      }
    </>
  );
}
