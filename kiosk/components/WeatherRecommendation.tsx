"use client";
import React, { useState, useEffect } from 'react';
import { useLanguage } from './LanguageProvider';
import { translateMenuItem } from '../lib/translations';

interface RecommendationProps {
  menuItems: Array<{ id: number | null; name: string; price: number; category?: string | null }>;
}

export default function WeatherRecommendation({ menuItems }: RecommendationProps) {
  const { t, language } = useLanguage();
  const [temperature, setTemperature] = useState<number | null>(null);
  const [recommendedItem, setRecommendedItem] = useState<any>(null);

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=30.6280&longitude=-96.3344&current_weather=true&temperature_unit=fahrenheit')
      .then(res => res.json())
      .then(data => {
        setTemperature(Math.round(data.current_weather.temperature));
      })
      .catch(() => setTemperature(70)); // Default to 70°F if fetch fails
  }, []);

  useEffect(() => {
    if (temperature === null || menuItems.length === 0) return;

    const isWarm = temperature >= 65;
    let item;

    if (isWarm) {
      const drinks = menuItems.filter(i => {
        const cat = (i.category || '').toLowerCase();
        return cat.includes('tea') || cat.includes('drink');
      });
      item = drinks.length > 0 ? drinks[0] : menuItems[0];
    } else {
      const snacks = menuItems.filter(i => {
        const cat = (i.category || '').toLowerCase();
        return cat.includes('snack') || cat.includes('dessert');
      });
      item = snacks.length > 0 ? snacks[0] : menuItems[0];
    }

    setRecommendedItem(item);
  }, [temperature, menuItems]);

  if (!temperature || !recommendedItem) {
    return null;
  }

  return (
    <aside className="fixed left-4 bottom-4 w-56 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-zinc-800 p-3 shadow-lg text-black dark:text-white transition-colors z-40" aria-label="Weather recommendation">
      <h3 className="text-base font-semibold mb-2">{t('Recommendation')}</h3>
      
      <div className="mb-2">
        <span className="text-xl font-bold">{temperature}°F</span>
      </div>
      
      <div className="bg-gray-50 dark:bg-zinc-700 rounded p-2">
        <div className="font-medium text-sm mb-1">
          {translateMenuItem(recommendedItem.name, language)}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-300">
          ${recommendedItem.price.toFixed(2)}
        </div>
      </div>
    </aside>
  );
}
