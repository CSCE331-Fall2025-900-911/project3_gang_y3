"use client";
import React, { useState } from 'react';
import { TOPPINGS } from '../lib/toppings';
import { useLanguage } from './LanguageProvider';
import { translateMenuItem } from '../lib/translations';

// Duplicate types for self-containment or could export from a types file
// For now, defining locally to match existing patterns
export type Item = { id: number | null; name: string; price: number; category?: string | null };
export type CartItem = Item & { quantity: number; custom?: { size: 'regular' | 'large'; temperature: 'hot' | 'cold'; ice: 'low' | 'medium' | 'high'; sugar: 'low' | 'medium' | 'high'; toppings?: number[] } };

export type CustomizationType = 'full' | 'drink' | 'quantity' | null;

const SIZE_PRICES = { regular: 0, large: 0.75 };
const TOPPING_PRICE = 0.50;

interface CustomizationModalProps {
    item: Item;
    type: CustomizationType;
    initialTemperature?: 'hot' | 'cold';
    onClose: () => void;
    onConfirm: (cartItem: CartItem) => void;
}

export default function CustomizationModal({ item, type, initialTemperature, onClose, onConfirm }: CustomizationModalProps) {
    const { t, language } = useLanguage();

    const [quantity, setQuantity] = useState(1);
    const [size, setSize] = useState<'regular' | 'large'>('regular');
    const [temperature, setTemperature] = useState<'hot' | 'cold'>(initialTemperature || 'cold');
    const [ice, setIce] = useState<'low' | 'medium' | 'high'>('medium');
    const [sugar, setSugar] = useState<'low' | 'medium' | 'high'>('medium');
    const [selectedToppings, setSelectedToppings] = useState<number[]>([]);

    const toggleTopping = (toppingId: number) => {
        setSelectedToppings(prev =>
            prev.includes(toppingId)
                ? prev.filter(id => id !== toppingId)
                : [...prev, toppingId]
        );
    };

    const handleConfirm = () => {
        let newItem: CartItem;

        if (type === 'quantity') {
            // Snacks - just quantity, no customization
            newItem = { ...item, id: item.id, quantity };
        } else if (type === 'drink') {
            // Seasonal/Smoothies - size, sugar, toppings (no temp/ice)
            const sizeUpcharge = SIZE_PRICES[size];
            const toppingsUpcharge = selectedToppings.length * TOPPING_PRICE;
            newItem = {
                ...item,
                id: item.id,
                price: item.price + sizeUpcharge + toppingsUpcharge,
                quantity,
                custom: { size, temperature: 'cold', ice: 'medium', sugar, toppings: selectedToppings.length > 0 ? selectedToppings : undefined }
            };
        } else if (type === 'full') {
            // Full customization
            const sizeUpcharge = SIZE_PRICES[size];
            const toppingsUpcharge = selectedToppings.length * TOPPING_PRICE;
            newItem = {
                ...item,
                id: item.id,
                price: item.price + sizeUpcharge + toppingsUpcharge,
                quantity,
                custom: { size, temperature, ice, sugar, toppings: selectedToppings.length > 0 ? selectedToppings : undefined }
            };
        } else {
            // Fallback
            newItem = { ...item, id: item.id, quantity };
        }

        onConfirm(newItem);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={onClose}></div>
            <div className="relative z-10 w-[90%] max-w-md rounded bg-white dark:bg-zinc-800 p-6 shadow-lg text-black dark:text-white transition-colors">
                <h3 className="text-lg font-semibold mb-3">{t("Customize:")} {translateMenuItem(item.name, language)}</h3>

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

                {/* Size */}
                {(type === 'full' || type === 'drink') && (
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
                {type === 'full' && (
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

                {/* Ice - show only for full customization AND if not hot */}
                {type === 'full' && temperature !== 'hot' && (
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
                {(type === 'full' || type === 'drink') && (
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
                {(type === 'full' || type === 'drink') && (
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
                    <button className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={onClose}>
                        {t("Cancel")}
                    </button>
                    <button className="px-3 py-1 rounded bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-colors" onClick={handleConfirm}>
                        {t("Add to cart")}
                    </button>
                </div>
            </div>
        </div>
    );
}
