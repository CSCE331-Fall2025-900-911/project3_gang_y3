"use client";
import React, { useState } from 'react';
import { useLanguage } from './LanguageProvider';
import { translateMenuItem } from '../lib/translations';

type Item = { id: number | null; name: string; price: number };
type CartItem = Item & { custom?: { ice: 'low' | 'medium' | 'high'; sugar: 'low' | 'medium' | 'high' } };

export default function Cart({ items, onClear, onRemove }: { items: CartItem[]; onClear: () => void; onRemove?: (index: number) => void }) {
  const { t, language } = useLanguage();
  const [isPlacing, setIsPlacing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const total = items.reduce((s, i) => s + (i.price || 0), 0);
  
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
    } catch (error) {
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
            <div key={`${it.id ?? it.name}-${idx}`} className="py-1 text-sm text-black dark:text-white group">
              <div className="flex items-center justify-between">
                <div className="font-medium flex-1">{translateMenuItem(it.name, language)}</div>
                <div className="text-gray-600 dark:text-gray-300 mr-2">${(it.price || 0).toFixed(2)}</div>
                {onRemove && (
                  <button
                    onClick={() => onRemove(idx)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove item"
                  >
                    ×
                  </button>
                )}
              </div>
              {it.custom && (
                <div className="text-xs text-zinc-600 dark:text-zinc-400">{t('Ice')}: {t(it.custom.ice)}, {t('Sugar')}: {t(it.custom.sugar)}</div>
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
