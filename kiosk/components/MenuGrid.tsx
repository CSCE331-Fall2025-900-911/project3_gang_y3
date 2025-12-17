"use client";
import React, { useState } from 'react';
import ItemCard from './ItemCard';
import Cart from './Cart';
import { TOPPINGS } from '../lib/toppings';
import { useLanguage } from './LanguageProvider';
import { translateMenuItem } from '../lib/translations';

export type Item = { id: number | null; name: string; price: number; category?: string | null };
type CartItem = Item & { quantity: number; custom?: { size: 'regular' | 'large'; temperature: 'hot' | 'cold'; ice: 'low' | 'medium' | 'high'; sugar: 'low' | 'medium' | 'high'; toppings?: number[] } };

const SIZE_PRICES = { regular: 0, large: 0.75 };
const TOPPING_PRICE = 0.50;

// Customization types: 'full' = all options, 'drink' = size/sugar/toppings (no temp/ice), 'quantity' = just quantity
type CustomizationType = 'full' | 'drink' | 'quantity' | null;

export default function MenuGrid({ items, customerId, cartState, onPointsUpdate, onQuickOrderSaved }: { items: Item[]; customerId?: number; cartState: [CartItem[], React.Dispatch<React.SetStateAction<CartItem[]>>]; onPointsUpdate?: (points: number) => void; onQuickOrderSaved?: () => void }) {
  const { t, language } = useLanguage();
  const [cart, setCart] = cartState;
  const [customizing, setCustomizing] = useState<Item | null>(null);
  const [customType, setCustomType] = useState<CustomizationType>(null);
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState<'regular' | 'large'>('regular');
  const [temperature, setTemperature] = useState<'hot' | 'cold'>('cold');
  const [ice, setIce] = useState<'low' | 'medium' | 'high'>('medium');
  const [sugar, setSugar] = useState<'low' | 'medium' | 'high'>('medium');
  const [selectedToppings, setSelectedToppings] = useState<number[]>([]);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);

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

  function requestAdd(it: Item) {
    const cat = (it.category || '').toString().trim().toLowerCase();

    // Full customization: milk tea, fruit tea, specialty drinks (size, temp, ice, sugar, toppings)
    const fullCustom = ['milk tea', 'fruit tea', 'specialty drinks', 'specialty'];
    // Drink customization: seasonal, smoothies (size, sugar, toppings - no temp/ice)
    const drinkCustom = ['seasonal', 'smoothies', 'smoothie'];
    // Quantity only: snacks/desserts
    const quantityOnly = ['snacks', 'desserts', 'snacks/desserts'];

    const isFullCustom = fullCustom.includes(cat) || fullCustom.some((c) => cat.includes(c));
    const isDrinkCustom = drinkCustom.includes(cat) || drinkCustom.some((c) => cat.includes(c));
    const isQuantityOnly = quantityOnly.includes(cat) || quantityOnly.some((c) => cat.includes(c));

    if (isFullCustom) {
      setCustomizing(it);
      setCustomType('full');
      setQuantity(1);
      setSize('regular');
      setTemperature('cold');
      setIce('medium');
      setSugar('medium');
      setSelectedToppings([]);
    } else if (isDrinkCustom) {
      setCustomizing(it);
      setCustomType('drink');
      setQuantity(1);
      setSize('regular');
      setSugar('medium');
      setSelectedToppings([]);
    } else if (isQuantityOnly) {
      setCustomizing(it);
      setCustomType('quantity');
      setQuantity(1);
    } else {
      const newItem: CartItem = { ...it, id: it.id, quantity: 1 };
      setCart((s) => [...s, newItem]);
      setAddedMessage(`${it.name} added to cart!`);
      setTimeout(() => setAddedMessage(null), 1500);
    }
  }

  function confirmAdd() {
    if (!customizing) return;

    let newItem: CartItem;

    if (customType === 'quantity') {
      // Snacks - just quantity, no customization
      newItem = { ...customizing, id: customizing.id, quantity };
    } else if (customType === 'drink') {
      // Seasonal/Smoothies - size, sugar, toppings (no temp/ice)
      const sizeUpcharge = SIZE_PRICES[size];
      const toppingsUpcharge = selectedToppings.length * TOPPING_PRICE;
      newItem = {
        ...customizing,
        id: customizing.id,
        price: customizing.price + sizeUpcharge + toppingsUpcharge,
        quantity,
        custom: { size, temperature: 'cold', ice: 'medium', sugar, toppings: selectedToppings.length > 0 ? selectedToppings : undefined }
      };
    } else if (customType === 'full') {
      // Full customization
      const sizeUpcharge = SIZE_PRICES[size];
      const toppingsUpcharge = selectedToppings.length * TOPPING_PRICE;
      newItem = {
        ...customizing,
        id: customizing.id,
        price: customizing.price + sizeUpcharge + toppingsUpcharge,
        quantity,
        custom: { size, temperature, ice, sugar, toppings: selectedToppings.length > 0 ? selectedToppings : undefined }
      };
    } else {
      // Fallback: just add with id
      newItem = { ...customizing, id: customizing.id, quantity };
    }

    setCart((s) => [...s, newItem]);
    setAddedMessage(`${customizing.name} added to cart!`);
    setTimeout(() => setAddedMessage(null), 1500);
    setCustomizing(null);
    setCustomType(null);
  }

  const toggleTopping = (toppingId: number) => {
    setSelectedToppings(prev =>
      prev.includes(toppingId)
        ? prev.filter(id => id !== toppingId)
        : [...prev, toppingId]
    );
  };

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

  function cancelAdd() {
    setCustomizing(null);
    setCustomType(null);
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
        {sortedCategories.map((category) => (
          <div key={category}>
            <h2 className="text-xl font-semibold mb-3 text-black dark:text-white">{category.charAt(0).toUpperCase() + category.slice(1)}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {grouped[category].map((it, idx) => (
                <ItemCard key={it.id ?? `${it.name ?? 'item'}-${idx}`} item={it} onAdd={requestAdd} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <Cart items={cart} customerId={customerId} onClear={clearCart} onRemove={removeItem} onUpdateQuantity={updateItemQuantity} onPointsUpdate={onPointsUpdate} onQuickOrderSaved={onQuickOrderSaved} />

      {customizing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={cancelAdd}></div>
          <div className="relative z-10 w-[90%] max-w-md rounded bg-white dark:bg-zinc-800 p-6 shadow-lg text-black dark:text-white transition-colors">
            <h3 className="text-lg font-semibold mb-3">{t("Customize:")} {translateMenuItem(customizing.name, language)}</h3>

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

            {/* Size - show for full and drink customization */}
            {(customType === 'full' || customType === 'drink') && (
              <div className="mb-4">
                <div className="font-medium mb-1">{t("Size")}</div>
                <div className="flex gap-3">
                  {(['regular', 'large'] as const).map((s) => (
                    <label key={s} className="flex items-center gap-2">
                      <input type="radio" name="size" value={s} checked={size === s} onChange={() => setSize(s)} />
                      <span className="capitalize">{t(s)} {SIZE_PRICES[s] > 0 ? `(+$${SIZE_PRICES[s].toFixed(2)})` : ''}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Temperature - show only for full customization */}
            {customType === 'full' && (
              <div className="mb-4">
                <div className="font-medium mb-1">{t("Temperature")}</div>
                <div className="flex gap-3">
                  {(['hot', 'cold'] as const).map((temp) => (
                    <label key={temp} className="flex items-center gap-2">
                      <input type="radio" name="temperature" value={temp} checked={temperature === temp} onChange={() => setTemperature(temp)} />
                      <span className="capitalize">{t(temp)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Ice - show only for full customization */}
            {customType === 'full' && (
              <div className="mb-4">
                <div className="font-medium mb-1">{t("Ice")}</div>
                <div className="flex gap-3">
                  {(['low', 'medium', 'high'] as const).map((lvl) => (
                    <label key={lvl} className="flex items-center gap-2">
                      <input type="radio" name="ice" value={lvl} checked={ice === lvl} onChange={() => setIce(lvl)} />
                      <span className="capitalize">{t(lvl)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Sugar - show for full and drink customization */}
            {(customType === 'full' || customType === 'drink') && (
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
            )}

            {/* Toppings - show for full and drink customization */}
            {(customType === 'full' || customType === 'drink') && (
              <div className="mb-4">
                <div className="font-medium mb-2">{t("Toppings")} ({t("optional")}) - +${TOPPING_PRICE.toFixed(2)} {t("each")}</div>
                <div className="grid grid-cols-2 gap-2">
                  {TOPPINGS.map((topping) => (
                    <label key={topping.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedToppings.includes(topping.id)}
                        onChange={() => toggleTopping(topping.id)}
                        className="cursor-pointer"
                      />
                      <span className="text-sm">{t(topping.name)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

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
