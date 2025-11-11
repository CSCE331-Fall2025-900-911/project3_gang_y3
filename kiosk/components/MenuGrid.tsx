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
    }
  }

  function confirmAdd() {
    if (!customizing) return;
    const newItem: CartItem = { ...customizing, custom: { ice, sugar } };
    setCart((s) => [...s, newItem]);
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
          <div className="absolute inset-0 bg-black/40" onClick={cancelAdd}></div>
          <div className="relative z-10 w-[90%] max-w-md rounded bg-white p-6 shadow-lg text-black">
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
              <button className="px-3 py-1 rounded border" onClick={cancelAdd}>
                Cancel
              </button>
              <button className="px-3 py-1 rounded bg-black text-white" onClick={confirmAdd}>
                Add to cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
