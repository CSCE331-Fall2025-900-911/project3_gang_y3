"use client";
import React, { useState } from 'react';
import { useLanguage } from './LanguageProvider';
import { translateMenuItem } from '../lib/translations';
import { TOPPINGS } from '../lib/toppings';

type Item = { id: number | null; name: string; price: number };
type CartItem = Item & { quantity: number; custom?: { temperature: 'hot' | 'cold'; ice: 'low' | 'medium' | 'high'; sugar: 'low' | 'medium' | 'high'; toppings?: number[] } };

export default function Cart({ items, onClear, onRemove, onUpdateQuantity }: { items: CartItem[]; onClear: () => void; onRemove?: (index: number) => void; onUpdateQuantity?: (index: number, delta: number) => void }) {
  const { t, language } = useLanguage();
  const [isPlacing, setIsPlacing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
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
        body: JSON.stringify({ items }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: `${t('Order')} #${data.orderId} ${t('placed successfully!')}` });
        setTimeout(() => {
          onClear();
          setMessage(null);
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.error || t('Failed to place order') });
      }
    } catch {
      setMessage({ type: 'error', text: t('Failed to connect to server') });
    } finally {
      setIsPlacing(false);
    }
  };
  
  return (
    <div className="fixed right-6 bottom-6 w-80 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-zinc-800 p-4 shadow-lg text-black dark:text-white transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-black dark:text-white">{t('Cart')}</div>
        <button className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200" onClick={onClear}>
          {t('Clear')}
        </button>
      </div>
      <div className="max-h-48 overflow-auto">
        {items.length === 0 ? (
          <div className="text-sm text-zinc-500 dark:text-zinc-400">{t('Cart is empty')}</div>
        ) : (
          items.map((it, idx) => (
            <div key={`${it.id ?? it.name}-${idx}`} className="py-2 text-sm text-black dark:text-white group border-b border-gray-100 dark:border-gray-700 last:border-0">
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium flex-1">{translateMenuItem(it.name, language)}</div>
                <div className="text-gray-600 dark:text-gray-300">${((it.price || 0) * it.quantity).toFixed(2)}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {onUpdateQuantity && (
                    <>
                      <button
                        onClick={() => onUpdateQuantity(idx, -1)}
                        className="w-5 h-5 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-xs"
                      >
                        −
                      </button>
                      <span className="text-xs w-4 text-center">{it.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(idx, 1)}
                        className="w-5 h-5 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-xs"
                      >
                        +
                      </button>
                    </>
                  )}
                  {!onUpdateQuantity && <span className="text-xs text-gray-500">×{it.quantity}</span>}
                  <span className="text-xs text-gray-500 dark:text-gray-400">${(it.price || 0).toFixed(2)} each</span>
                </div>
                {onRemove && (
                  <button
                    onClick={() => onRemove(idx)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-lg leading-none"
                    aria-label="Remove item"
                  >
                    ×
                  </button>
                )}
              </div>
              {it.custom && (
                <div className="text-xs text-zinc-600 dark:text-zinc-400">
                  {t('Temperature')}: {t(it.custom.temperature)} | {t('Ice')}: {t(it.custom.ice)} | {t('Sugar')}: {t(it.custom.sugar)}
                  {it.custom.toppings && it.custom.toppings.length > 0 && (
                    <div className="mt-0.5">
                      {t('Toppings')}: {it.custom.toppings.map(id => TOPPINGS.find(t => t.id === id)?.name).filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="font-semibold">{t('Total')}</div>
        <div className="font-semibold">${total.toFixed(2)}</div>
      </div>
      
      {message && (
        <div className={`mt-3 p-2 rounded text-sm ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}
      
      <div className="mt-3">
        <button 
          className="w-full rounded bg-black dark:bg-white text-white dark:text-black py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          onClick={placeOrder}
          disabled={isPlacing || items.length === 0}
        >
          {isPlacing ? t('Placing order...') : t('Place order')}
        </button>
      </div>
    </div>
  );
}
