"use client";
import React, { useState, useEffect } from 'react';
import { useLanguage } from './LanguageProvider';
import { translateMenuItem } from '../lib/translations';

interface RecommendationProps {
  menuItems: Array<{ id: number | null; name: string; price: number; category?: string | null }>;
  onAddToCart?: (item: any, defaults?: { temperature?: 'hot' | 'cold' }) => void;
}

export default function WeatherRecommendation({ menuItems, onAddToCart }: RecommendationProps) {
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

    const isCold = temperature < 60;
    const isHot = temperature >= 75;
    let item;

    if (isCold) {
      // Cold weather: recommend hot drinks or snacks
      const hotDrinks = menuItems.filter(i => {
        const cat = (i.category || '').toLowerCase();
        const name = (i.name || '').toLowerCase();
        return (cat.includes('milk tea') || cat.includes('specialty')) &&
          (name.includes('hot') || name.includes('taro') || name.includes('matcha'));
      });

      const snacks = menuItems.filter(i => {
        const cat = (i.category || '').toLowerCase();
        return cat.includes('snack') || cat.includes('dessert');
      });

      // Prefer hot drinks, fallback to snacks
      if (hotDrinks.length > 0) {
        item = hotDrinks[Math.floor(Math.random() * hotDrinks.length)];
      } else if (snacks.length > 0) {
        item = snacks[Math.floor(Math.random() * snacks.length)];
      } else {
        item = menuItems[0];
      }
    } else if (isHot) {
      // Hot weather: recommend cold drinks
      const coldDrinks = menuItems.filter(i => {
        const cat = (i.category || '').toLowerCase();
        const name = (i.name || '').toLowerCase();
        return (cat.includes('fruit tea') || cat.includes('smoothie') || cat.includes('seasonal')) &&
          !name.includes('hot');
      });
      item = coldDrinks.length > 0 ? coldDrinks[Math.floor(Math.random() * coldDrinks.length)] : menuItems[0];
    } else {
      // Mild weather: any drink
      const drinks = menuItems.filter(i => {
        const cat = (i.category || '').toLowerCase();
        return cat.includes('tea') || cat.includes('drink') || cat.includes('smoothie');
      });
      item = drinks.length > 0 ? drinks[Math.floor(Math.random() * drinks.length)] : menuItems[0];
    }

    setRecommendedItem(item);
  }, [temperature, menuItems]);

  if (!temperature || !recommendedItem) {
    return null;
  }

  // Generate dynamic message based on temperature
  const getWeatherMessage = () => {
    if (temperature < 50) {
      return t("Brrr! It's freezing! Warm up with");
    } else if (temperature < 60) {
      return t("Wow, it's chilly! Warm up with");
    } else if (temperature >= 85) {
      return t("It's scorching! Cool down with");
    } else if (temperature >= 75) {
      return t("It's hot out there! Refresh yourself with");
    } else {
      return t("Perfect weather for");
    }
  };

  const handleAdd = () => {
    if (onAddToCart && recommendedItem) {
      // If it's cold (< 60F), suggest hot drink
      if (temperature !== null && temperature < 60) {
        onAddToCart(recommendedItem, { temperature: 'hot' });
      } else {
        onAddToCart(recommendedItem);
      }
    }
  };

  return (
    <aside className="w-64 rounded-lg border border-gray-200 dark:border-gray-600 bg-gradient-to-br from-white to-gray-50 dark:from-zinc-800 dark:to-zinc-900 p-4 shadow-xl text-black dark:text-white transition-all hover:shadow-2xl" aria-label="Weather recommendation">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('Recommendation')}</h3>
        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{temperature}°F</span>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
        {getWeatherMessage()}
      </p>

      <div className="bg-white dark:bg-zinc-700 rounded-lg p-3 shadow-sm border border-gray-100 dark:border-zinc-600 mb-3">
        <div className="font-semibold text-base mb-1">
          {translateMenuItem(recommendedItem.name, language)}
        </div>
        <div className="text-sm font-bold text-green-600 dark:text-green-400">
          ${recommendedItem.price.toFixed(2)}
        </div>
      </div>

      {onAddToCart && (
        <button
          onClick={handleAdd}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg active:scale-95 transform"
        >
          {t('Add to Cart')}
        </button>
      )}
    </aside>
  );
}
