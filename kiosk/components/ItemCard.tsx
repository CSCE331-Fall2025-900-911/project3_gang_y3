"use client";
import React from 'react';
import { useLanguage } from './LanguageProvider';
import { translateMenuItem } from '../lib/translations';

type Item = { id: number | null; name: string; price: number; category?: string | null };

export default function ItemCard({ item, onAdd }: { item: Item; onAdd: (it: Item) => void }) {
  const { t, language } = useLanguage();

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 flex flex-col bg-gradient-to-br from-white to-gray-50 dark:from-zinc-700 dark:to-zinc-800 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:scale-[1.05] cursor-default">
      <div className="font-semibold text-base text-black dark:text-white mb-1">{translateMenuItem(item.name, language)}</div>
      <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">{item.category ? t(item.category) : ''}</div>
      <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-600">
        <div className="font-bold text-lg text-green-600 dark:text-green-400">${item.price.toFixed(2)}</div>
        <button
          className="ml-4 rounded-md bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 px-4 py-2 text-sm font-medium text-white hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 active:shadow-inner transition-all"
          onClick={() => onAdd(item)}
          aria-label={`Add ${item.name} to cart`}
        >
          {t("Add")}
        </button>
      </div>
    </div>
  );
}
