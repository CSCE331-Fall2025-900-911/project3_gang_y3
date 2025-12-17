"use client";
import React, { useState } from 'react';
import ItemCard from './ItemCard';
import Cart from './Cart';
import { TOPPINGS } from '../lib/toppings';
import { useLanguage } from './LanguageProvider';
import { translateMenuItem } from '../lib/translations';

import { Item, CartItem } from './CustomizationModal';

export default function MenuGrid({ items, customerId, cartState, onPointsUpdate, onQuickOrderSaved, onRequestAdd, onRefresh }: { items: Item[]; customerId?: number; cartState: [CartItem[], React.Dispatch<React.SetStateAction<CartItem[]>>]; onPointsUpdate?: (points: number) => void; onQuickOrderSaved?: () => void; onRequestAdd: (item: Item) => void; onRefresh?: () => void }) {
  const { t } = useLanguage();
  const [cart, setCart] = cartState;

  // Normalize category keys to lower case for consistent matching
  const grouped = items.reduce((acc: Record<string, Item[]>, it) => {
    const cat = (it.category?.trim() || "Other").toLowerCase();
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(it);
    return acc;
  }, {});

  // Desired category order
  const categoryOrder = [
    "milk tea",
    "fruit tea",
    "specialty",
    "season",
    "snacks"
  ];

  // Sort categories for display
  // Use lower case keys for sorting and rendering
  const groupedKeys = Object.keys(grouped);
  const sortedCategories = [
    ...categoryOrder.filter((cat) => groupedKeys.includes(cat)),
    ...groupedKeys.filter((cat) => !categoryOrder.includes(cat))
  ];



  const updateItemQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const item = prev[index];
      const newQty = item.quantity + delta;

      // If quantity would be 0 or less, remove the item
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }

      // Otherwise update the quantity
      return prev.map((item, i) => {
        if (i === index) {
          return { ...item, quantity: newQty };
        }
        return item;
      });
    });
  };



  function clearCart() {
    setCart([]);
  }

  function removeItem(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="relative">
      <div className="flex flex-col gap-10">
        {sortedCategories.map((category) => (
          <div key={category}>
            <h2 className="text-xl font-semibold mb-3 text-black dark:text-white">{category.charAt(0).toUpperCase() + category.slice(1)}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {grouped[category].map((it, idx) => (
                <ItemCard key={it.id ?? `${it.name ?? 'item'}-${idx}`} item={it} onAdd={onRequestAdd} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <Cart items={cart} customerId={customerId} onClear={clearCart} onRemove={removeItem} onUpdateQuantity={updateItemQuantity} onPointsUpdate={onPointsUpdate} onQuickOrderSaved={onQuickOrderSaved} onOrderSuccess={onRefresh} />



    </div>
  );
}
