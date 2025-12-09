"use client";
import React, { useState } from 'react';
import ItemCard from './ItemCard';
import Cart from './Cart';
<<<<<<< Updated upstream
import { TOPPINGS } from '../lib/toppings';
=======
>>>>>>> Stashed changes
import { useLanguage } from './LanguageProvider';
import { translateMenuItem } from '../lib/translations';

export type Item = { id: number | null; name: string; price: number; category?: string | null };
type CartItem = Item & { quantity: number; custom?: { temperature: 'hot' | 'cold'; ice: 'low' | 'medium' | 'high'; sugar: 'low' | 'medium' | 'high'; toppings?: number[] } };

export default function MenuGrid({ items }: { items: Item[] }) {
  const { t, language } = useLanguage();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customizing, setCustomizing] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [temperature, setTemperature] = useState<'hot' | 'cold'>('cold');
  const [ice, setIce] = useState<'low' | 'medium' | 'high'>('medium');
  const [sugar, setSugar] = useState<'low' | 'medium' | 'high'>('medium');
  const [selectedToppings, setSelectedToppings] = useState<number[]>([]);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);

  const grouped = items.reduce((acc: Record<string, Item[]>, it) => {
    const cat = it.category?.trim() || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(it);
    return acc;
  }, {});

  function requestAdd(it: Item) {
    const cat = (it.category || '').toString().trim().toLowerCase();
    const customizable = ['milk tea', 'fruit tea', 'specialty drinks', 'specialty'];
    const needsCustom = customizable.includes(cat) || customizable.some((c) => cat.includes(c));

    if (needsCustom) {
      setCustomizing(it);
      setQuantity(1);
      setTemperature('cold');
      setIce('medium');
      setSugar('medium');
      setSelectedToppings([]);
    } else {
      const newItem: CartItem = { ...it, quantity: 1 };
      setCart((s) => [...s, newItem]);
      setAddedMessage(`${it.name} added to cart!`);
      setTimeout(() => setAddedMessage(null), 1500);
    }
  }

  function confirmAdd() {
    if (!customizing) return;
    const newItem: CartItem = { 
      ...customizing,
      quantity,
      custom: { temperature, ice, sugar, toppings: selectedToppings.length > 0 ? selectedToppings : undefined } 
    };
    setCart((s) => [...s, newItem]);
    setAddedMessage(`${customizing.name} added to cart!`);
    setTimeout(() => setAddedMessage(null), 1500);
    setCustomizing(null);
  }

  const toggleTopping = (toppingId: number) => {
    setSelectedToppings(prev => 
      prev.includes(toppingId) 
        ? prev.filter(id => id !== toppingId)
        : [...prev, toppingId]
    );
  };

  const updateItemQuantity = (index: number, delta: number) => {
    setCart(prev => prev.map((item, i) => {
      if (i === index) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  function cancelAdd() {
    setCustomizing(null);
  }

  function clearCart() {
    setCart([]);
  }

  function removeItem(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="relative">
      <div className="flex flex-col gap-10">
        {Object.entries(grouped).map(([category, list]) => (
          <div key={category}>
            <h2 className="text-xl font-semibold mb-3 text-black dark:text-white">{category}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {list.map((it, idx) => (
                <ItemCard key={it.id ?? `${it.name ?? 'item'}-${idx}`} item={it} onAdd={requestAdd} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <Cart items={cart} onClear={clearCart} onRemove={removeItem} onUpdateQuantity={updateItemQuantity} />

      {customizing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={cancelAdd}></div>
          <div className="relative z-10 w-[90%] max-w-md rounded bg-white dark:bg-zinc-800 p-6 shadow-lg text-black dark:text-white transition-colors">
            <h3 className="text-lg font-semibold mb-3">{t("Customize:")} {translateMenuItem(customizing.name, language)}</h3>
<<<<<<< Updated upstream

            <div className="mb-4">
              <div className="font-medium mb-2">{t("Quantity")}</div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-lg font-semibold"
                >
                  −
                </button>
                <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-lg font-semibold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mb-4">
              <div className="font-medium mb-1">{t("Temperature")}</div>
              <div className="flex gap-3">
                {(['hot', 'cold'] as const).map((temp) => (
                  <label key={temp} className="flex items-center gap-2">
                    <input type="radio" name="temperature" value={temp} checked={temperature === temp} onChange={() => setTemperature(temp)} />
                    <span className="capitalize">{t(temp)}</span>
=======
            <div className="mb-4">
              <div className="font-medium mb-1">{t("Ice")}</div>
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
                    <span className="capitalize">{t(lvl)}</span>
>>>>>>> Stashed changes
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-4">
<<<<<<< Updated upstream
              <div className="font-medium mb-1">{t("Ice")}</div>
=======
              <div className="font-medium mb-1">{t("Sugar")}</div>
>>>>>>> Stashed changes
              <div className="flex gap-3">
                {(['low', 'medium', 'high'] as const).map((lvl) => (
                  <label key={lvl} className="flex items-center gap-2">
                    <input type="radio" name="ice" value={lvl} checked={ice === lvl} onChange={() => setIce(lvl)} />
                    <span className="capitalize">{t(lvl)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <div className="font-medium mb-1">{t("Sugar")}</div>
              <div className="flex gap-3">
                {(['low', 'medium', 'high'] as const).map((lvl) => (
                  <label key={lvl} className="flex items-center gap-2">
                    <input type="radio" name="sugar" value={lvl} checked={sugar === lvl} onChange={() => setSugar(lvl)} />
                    <span className="capitalize">{t(lvl)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <div className="font-medium mb-2">{t("Toppings")} ({t("optional")})</div>
              <div className="grid grid-cols-2 gap-2">
                {TOPPINGS.map((topping) => (
                  <label key={topping.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedToppings.includes(topping.id)}
                      onChange={() => toggleTopping(topping.id)}
                      className="cursor-pointer"
                    />
<<<<<<< Updated upstream
                    <span className="text-sm">{t(topping.name)}</span>
=======
                    <span className="capitalize">{t(lvl)}</span>
>>>>>>> Stashed changes
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={cancelAdd}>
                {t("Cancel")}
              </button>
              <button className="px-3 py-1 rounded bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-colors" onClick={confirmAdd}>
                {t("Add to cart")}
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
