"use client";
import React from 'react';

type Item = { id: number | null; name: string; price: number };
type CartItem = Item & { custom?: { ice: 'low' | 'medium' | 'high'; sugar: 'low' | 'medium' | 'high' } };

export default function Cart({ items, onClear }: { items: CartItem[]; onClear: () => void }) {
  const total = items.reduce((s, i) => s + (i.price || 0), 0);
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
      <div className="mt-3">
        <button className="w-full rounded bg-black text-white py-2">Place order</button>
      </div>
    </div>
  );
}
