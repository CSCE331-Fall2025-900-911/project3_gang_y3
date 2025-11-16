"use client";
import React, { useState } from 'react';
import ItemCard from './ItemCard';
import Cart from './Cart';

export type Item = { id: number | null; name: string; price: number; category?: string | null };
type CartItem = Item & { custom?: { ice: 'low' | 'medium' | 'high'; sugar: 'low' | 'medium' | 'high' } };

export default function MenuGrid({ items }: { items: Item[] }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customizing, setCustomizing] = useState<Item | null>(null);
  const [ice, setIce] = useState<'low' | 'medium' | 'high'>('medium');
  const [sugar, setSugar] = useState<'low' | 'medium' | 'high'>('medium');
  const [addedMessage, setAddedMessage] = useState<string | null>(null);

  function requestAdd(it: Item) {
    const cat = (it.category || '').toString().trim().toLowerCase();
    const customizable = ['milk tea', 'fruit tea', 'specialty drinks', 'specialty'];
    const needsCustom = customizable.includes(cat) || customizable.some((c) => cat.includes(c));

    if (needsCustom) {
      setCustomizing(it);
      setIce('medium');
      setSugar('medium');
    } else {
      const newItem: CartItem = { ...it };
      setCart((s) => [...s, newItem]);
      setAddedMessage(`${it.name} added to cart!`);
      setTimeout(() => setAddedMessage(null), 1500);
    }
  }

  function confirmAdd() {
    if (!customizing) return;
    const newItem: CartItem = { ...customizing, custom: { ice, sugar } };
    setCart((s) => [...s, newItem]);
    setAddedMessage(`${customizing.name} added to cart!`);
    setTimeout(() => setAddedMessage(null), 1500);
    setCustomizing(null);
  }

  function cancelAdd() {
    setCustomizing(null);
  }

  function clearCart() {
    setCart([]);
  }

  return (
    <div className="relative">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {items.map((it, idx) => (
          <ItemCard key={it.id ?? `${it.name ?? 'item'}-${idx}`} item={it} onAdd={requestAdd} />
        ))}
      </div>

      <Cart items={cart} onClear={clearCart} />

      {customizing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={cancelAdd}></div>
          <div className="relative z-10 w-[90%] max-w-md rounded bg-white dark:bg-zinc-800 p-6 shadow-lg text-black dark:text-white transition-colors">
            <h3 className="text-lg font-semibold mb-3">Customize: {customizing.name}</h3>

            <div className="mb-4">
              <div className="font-medium mb-1">Ice</div>
              <div className="flex gap-3">
                {(['low', 'medium', 'high'] as const).map((lvl) => (
                  <label key={lvl} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="ice"
                      value={lvl}
                      checked={ice === lvl}
                      onChange={() => setIce(lvl)}
                    />
                    <span className="capitalize">{lvl}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <div className="font-medium mb-1">Sugar</div>
              <div className="flex gap-3">
                {(['low', 'medium', 'high'] as const).map((lvl) => (
                  <label key={lvl} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="sugar"
                      value={lvl}
                      checked={sugar === lvl}
                      onChange={() => setSugar(lvl)}
                    />
                    <span className="capitalize">{lvl}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={cancelAdd}
              >
                Cancel
              </button>

              <button
                className="px-3 py-1 rounded bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-colors"
                onClick={confirmAdd}
              >
                Add to cart
              </button>
            </div>
          </div>
        </div>
      )}

      {addedMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded shadow-lg animate-fadeSlideIn z-50">
          {addedMessage}
        </div>
      )}
    </div>
  );
}
