"use client";
import React, { useState } from 'react';

type Item = { id: number | null; name: string; price: number };
type CartItem = Item & { custom?: { ice: 'low' | 'medium' | 'high'; sugar: 'low' | 'medium' | 'high' } };

export default function Cart({ items, onClear }: { items: CartItem[]; onClear: () => void }) {
  const [isPlacing, setIsPlacing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const total = items.reduce((s, i) => s + (i.price || 0), 0);

  const placeOrder = async () => {
    if (items.length === 0) {
      setMessage({ type: 'error', text: 'Cart is empty' });
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
        setMessage({ type: 'success', text: `Order #${data.orderId} placed successfully!` });
        setTimeout(() => {
          onClear();
          setMessage(null);
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to place order' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to connect to server' });
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="fixed right-6 bottom-6 w-80 rounded border bg-white p-4 shadow-lg text-black">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-black">Cart</div>
        <button className="text-sm text-zinc-500" onClick={onClear}>
          Clear
        </button>
      </div>
      <div className="max-h-48 overflow-auto">
        {items.length === 0 ? (
          <div className="text-sm text-zinc-500">Cart is empty</div>
        ) : (
          items.map((it, idx) => (
            <div key={`${it.id ?? it.name}-${idx}`} className="py-1 text-sm text-black">
              <div className="flex items-center justify-between">
                <div className="font-medium">{it.name}</div>
                <div className="text-black/70">${(it.price || 0).toFixed(2)}</div>
              </div>
              {it.custom && (
                <div className="text-xs text-zinc-600">Ice: {it.custom.ice}, Sugar: {it.custom.sugar}</div>
              )}
            </div>
          ))
        )}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="font-semibold">Total</div>
        <div className="font-semibold">${total.toFixed(2)}</div>
      </div>

      {message && (
        <div className={`mt-3 p-2 rounded text-sm ${message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
          {message.text}
        </div>
      )}

      <div className="mt-3">
        <button
          className="w-full rounded bg-black text-white py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={placeOrder}
          disabled={isPlacing || items.length === 0}
        >
          {isPlacing ? 'Placing order...' : 'Place order'}
        </button>
      </div>
    </div>
  );
}