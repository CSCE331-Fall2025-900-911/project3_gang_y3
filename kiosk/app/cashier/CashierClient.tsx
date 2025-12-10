"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from "next/image";
import ItemCard from '../../components/ItemCard';
import Cart from '../../components/Cart';
import { useLanguage } from '../../components/LanguageProvider';
import { translateMenuItem } from '../../lib/translations';
import { TOPPINGS } from '../../lib/toppings';
import { useAuth } from '../../lib/useAuth';
import { signOut } from 'next-auth/react';

type MenuItem = { id: number | null; name: string; price: number; category?: string | null };
type CartItem = MenuItem & { quantity: number; custom?: { size: 'regular' | 'large'; temperature: 'hot' | 'cold'; ice: 'low' | 'medium' | 'high'; sugar: 'low' | 'medium' | 'high'; toppings?: number[] } };
type CustomizationType = 'full' | 'drink' | 'quantity' | null;

const SIZE_PRICES = { regular: 0, large: 0.75 };
const TOPPING_PRICE = 0.50;

interface CashierClientProps {
  menuItems: MenuItem[];
}

export default function CashierClient({ menuItems }: CashierClientProps) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const { role, isLoading } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customizing, setCustomizing] = useState<MenuItem | null>(null);
  const [customType, setCustomType] = useState<CustomizationType>(null);
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState<'regular' | 'large'>('regular');
  const [temperature, setTemperature] = useState<'hot' | 'cold'>('cold');
  const [ice, setIce] = useState<'low' | 'medium' | 'high'>('medium');
  const [sugar, setSugar] = useState<'low' | 'medium' | 'high'>('medium');
  const [selectedToppings, setSelectedToppings] = useState<number[]>([]);

  useEffect(() => {
    if (!isLoading && role !== 'Cashier') {
      router.push('/');
    }
  }, [role, isLoading, router]);

  const handleSignOut = async () => {
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('pendingRole');
    sessionStorage.removeItem('pendingUsername');
    await signOut({ callbackUrl: '/' });
  };

  const requestAdd = (item: MenuItem) => {
    const cat = (item.category || '').toString().trim().toLowerCase();
    
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
      setCustomizing(item);
      setCustomType('full');
      setQuantity(1);
      setSize('regular');
      setTemperature('cold');
      setIce('medium');
      setSugar('medium');
      setSelectedToppings([]);
    } else if (isDrinkCustom) {
      setCustomizing(item);
      setCustomType('drink');
      setQuantity(1);
      setSize('regular');
      setSugar('medium');
      setSelectedToppings([]);
    } else if (isQuantityOnly) {
      setCustomizing(item);
      setCustomType('quantity');
      setQuantity(1);
    } else {
      setCart(prev => [...prev, { ...item, quantity: 1 }]);
    }
  };

  const confirmAdd = () => {
    if (!customizing) return;
    
    let newItem: CartItem;
    
    if (customType === 'quantity') {
      // Snacks - just quantity, no customization
      newItem = { ...customizing, quantity };
    } else if (customType === 'drink') {
      // Seasonal/Smoothies - size, sugar, toppings (no temp/ice)
      const sizeUpcharge = SIZE_PRICES[size];
      const toppingsUpcharge = selectedToppings.length * TOPPING_PRICE;
      newItem = { 
        ...customizing,
        price: customizing.price + sizeUpcharge + toppingsUpcharge,
        quantity,
        custom: { size, temperature: 'cold', ice: 'medium', sugar, toppings: selectedToppings.length > 0 ? selectedToppings : undefined } 
      };
    } else {
      // Full customization
      const sizeUpcharge = SIZE_PRICES[size];
      const toppingsUpcharge = selectedToppings.length * TOPPING_PRICE;
      newItem = { 
        ...customizing,
        price: customizing.price + sizeUpcharge + toppingsUpcharge,
        quantity,
        custom: { size, temperature, ice, sugar, toppings: selectedToppings.length > 0 ? selectedToppings : undefined } 
      };
    }
    
    setCart(prev => [...prev, newItem]);
    setCustomizing(null);
    setCustomType(null);
  };

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

  const clearCart = () => {
    setCart([]);
  };

  const removeItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const cancelAdd = () => {
    setCustomizing(null);
    setCustomType(null);
    setQuantity(1);
    setTemperature('cold');
    setIce('medium');
    setSugar('medium');
    setSelectedToppings([]);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 font-sans p-8 text-black dark:text-white transition-colors">
      <button
        onClick={handleSignOut}
        className="fixed top-4 right-36 z-50 px-4 py-3 rounded-full bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white font-semibold transition-colors shadow-lg"
      >
        {t("Sign Out")}
      </button>
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
              onRemove={removeItem}
              onUpdateQuantity={updateItemQuantity}
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
                      <input
                        type="radio"
                        name="temperature"
                        value={temp}
                        checked={temperature === temp}
                        onChange={() => setTemperature(temp)}
                      />
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
            )}

            {/* Sugar - show for full and drink customization */}
            {(customType === 'full' || customType === 'drink') && (
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
                      <span className="text-sm">{topping.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

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
