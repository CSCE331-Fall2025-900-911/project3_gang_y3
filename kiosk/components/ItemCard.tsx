"use client";
import React from 'react';
import { useLanguage } from './LanguageProvider';
import { translateMenuItem } from '../lib/translations';

type Item = { id: number | null; name: string; price: number; category?: string | null; availability?: boolean };

export default function ItemCard({ item, onAdd }: { item: Item; onAdd: (it: Item) => void }) {
  const { t, language } = useLanguage();
  
    const outOfStock = item.availability === false;
    return (
      <div
        className={`border border-gray-200 dark:border-gray-600 rounded p-3 flex flex-col transition-colors hover:shadow-md hover:scale-[1.01] ${outOfStock ? 'bg-gray-200 dark:bg-zinc-800 opacity-60 pointer-events-none' : 'bg-white dark:bg-zinc-700'}`}
      >
        <div className="font-medium text-black dark:text-white">{translateMenuItem(item.name, language)}</div>
        <div className="text-sm text-gray-600 dark:text-gray-300">{item.category ? t(item.category) : ''}</div>
        <div className="mt-2 flex items-center justify-between">
          <div className="font-semibold text-black dark:text-white">${item.price.toFixed(2)}</div>
          <button
            className="ml-4 rounded bg-black dark:bg-white px-3 py-1 text-sm text-white dark:text-black hover:opacity-90 transition-colors"
            onClick={() => onAdd(item)}
            aria-label={`Add ${item.name} to cart`}
            disabled={outOfStock}
          >
            {outOfStock ? t('Out of Stock') : t('Add')}
          </button>
        </div>
      </div>
    );
}

