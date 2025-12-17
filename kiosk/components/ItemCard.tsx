"use client";
import React from 'react';
import Image from "next/image";
import { useLanguage } from './LanguageProvider';
import { translateMenuItem } from '../lib/translations';
import { ITEM_IMAGES } from '../lib/item-images';

type Item = { id: number | null; name: string; price: number; category?: string | null; availability?: boolean };

export default function ItemCard({ item, onAdd }: { item: Item; onAdd: (it: Item) => void }) {
  const { t, language } = useLanguage();

  const outOfStock = item.availability === false;


  // Helper to get image based on category
  const getImageForCategory = () => {
    // Check for specific item image first
    if (item.name && ITEM_IMAGES[item.name]) {
      return ITEM_IMAGES[item.name];
    }

    const cat = (item.category || '').toLowerCase();
    if (cat.includes('milk')) return '/assets/milk_tea.png';
    if (cat.includes('fruit')) return '/assets/fruit_tea.png';
    if (cat.includes('coffee')) return '/assets/coffee.png';
    if (cat.includes('snack') || cat.includes('dessert')) return '/assets/snacks.png';

    // Fallback
    if (cat.includes('smoothie')) return '/assets/fruit_tea.png'; // Reusing fruit tea for smoothies for now

    return '/assets/milk_tea.png'; // Default fallback
  };

  return (
    <div
      className={`relative group rounded-2xl p-4 flex flex-col transition-all duration-300 card-glow border border-transparent ${outOfStock ? 'bg-gray-100 dark:bg-zinc-800 opacity-60 grayscale' : 'bg-white dark:bg-zinc-800 hover:-translate-y-1'}`}
    >
      <div className="relative w-full h-48 mb-4 rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-700 shadow-inner group-hover:shadow-md transition-shadow">
        <Image
          src={getImageForCategory()}
          alt={item.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 768px) 50vw, 33vw"
        />
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <span className="text-white font-bold px-4 py-2 border-2 border-white rounded-lg transform -rotate-12">
              {t('SOLD OUT')}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <div className="font-bold text-lg text-black dark:text-white leading-tight mb-1 group-hover:text-primary dark:group-hover:text-primary-light transition-colors">
          {translateMenuItem(item.name, language)}
        </div>

        <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide opacity-80">
          {item.category ? (item.category === 'coffee' ? 'Coffee' : t(item.category)) : ''}
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div className="font-bold text-xl gradient-text bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            ${item.price.toFixed(2)}
          </div>
          <button
            className={`
              rounded-full px-5 py-2 text-sm font-bold shadow-lg transition-all active:scale-95
              ${outOfStock
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed hidden'
                : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gradient-to-r hover:from-primary hover:to-secondary hover:text-white dark:hover:text-white hover:shadow-primary/40'}
            `}
            onClick={() => onAdd(item)}
            aria-label={`Add ${item.name} to cart`}
            disabled={outOfStock}
          >
            {t('Add')} <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity absolute duration-300">+</span>
          </button>
        </div>
      </div>
    </div>
  );
}

