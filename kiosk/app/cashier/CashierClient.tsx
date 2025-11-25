"use client";
import React, { useState } from 'react';
import Image from "next/image";
import ItemCard from '../../components/ItemCard';
import Cart from '../../components/Cart';
import { useLanguage } from '../../components/LanguageProvider';
import { translateMenuItem } from '../../lib/translations';

type MenuItem = { id: number | null; name: string; price: number; category?: string | null };
type CartItem = MenuItem & { custom?: { ice: 'low' | 'medium' | 'high'; sugar: 'low' | 'medium' | 'high' } };

interface CashierClientProps {
  menuItems: MenuItem[];
}

export default function CashierClient({ menuItems }: CashierClientProps) {
  const { t, language } = useLanguage();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customizing, setCustomizing] = useState<MenuItem | null>(null);
  const [ice, setIce] = useState<'low' | 'medium' | 'high'>('medium');
  const [sugar, setSugar] = useState<'low' | 'medium' | 'high'>('medium');

  const requestAdd = (item: MenuItem) => {
    const cat = (item.category || '').toString().trim().toLowerCase();
    const customizable = ['milk tea', 'fruit tea', 'specialty drinks', 'specialty'];
    const needsCustom = customizable.includes(cat) || customizable.some((c) => cat.includes(c));

    if (needsCustom) {
      setCustomizing(item);
      setIce('medium');
      setSugar('medium');
    } else {
      setCart(prev => [...prev, item]);
    }
  };

  const confirmAdd = () => {
    if (!customizing) return;
    const newItem: CartItem = { ...customizing, custom: { ice, sugar } };
    setCart(prev => [...prev, newItem]);
    setCustomizing(null);
  };

  const cancelAdd = () => {
    setCustomizing(null);
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 font-sans p-8 text-black dark:text-white transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Image className="dark:invert" src="/next.svg" alt="Next.js" width={56} height={14} priority />
          <h1 className="text-2xl font-semibold">Cashier POS</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Menu Items</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {menuItems.map((item, idx) => (
                <ItemCard
                  key={item.id ?? `item-${idx}`}
                  item={item}
                  onAdd={requestAdd}
                />
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <Cart
              items={cart}
              onClear={clearCart}
            />
          </div>
        </div>
      </div>

      {customizing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={cancelAdd}></div>
          <div className="relative z-10 w-[90%] max-w-md rounded bg-white dark:bg-zinc-800 p-6 shadow-lg text-black dark:text-white transition-colors">
            <h3 className="text-lg font-semibold mb-3">
              {t("Customize:")} {translateMenuItem(customizing.name, language)}
            </h3>
            
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
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <div className="font-medium mb-1">{t("Sugar")}</div>
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
                    <span className="capitalize">{t(lvl)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button 
                className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" 
                onClick={cancelAdd}
              >
                {t("Cancel")}
              </button>
              <button 
                className="px-3 py-1 rounded bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-colors" 
                onClick={confirmAdd}
              >
                {t("Add to cart")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
