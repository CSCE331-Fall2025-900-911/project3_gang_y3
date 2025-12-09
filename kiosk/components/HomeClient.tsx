"use client";

import Image from "next/image";
import { useLanguage } from "../components/LanguageProvider";
import MenuGrid from "../components/MenuGrid";
import WeatherRecommendation from "../components/WeatherRecommendation";

type MenuItem = { id: number | null; name: string; price: number; category?: string | null };

interface HomeClientProps {
  menuItems: MenuItem[];
  error: string | null;
  hasDbUrl: boolean;
}

export default function HomeClient({ menuItems, error, hasDbUrl }: HomeClientProps) {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 dark:bg-zinc-900 font-sans p-8 text-black dark:text-white transition-colors">
      <WeatherRecommendation menuItems={menuItems} />
      <main className="w-full max-w-3xl bg-white dark:bg-zinc-800 p-8 shadow rounded text-black dark:text-white transition-colors">
        <div className="flex items-center gap-4 mb-6">
          <Image className="dark:invert" src="/next.svg" alt="Next.js" width={56} height={14} priority />
          <h1 className="text-2xl font-semibold">{t("Kiosk — Place an order")}</h1>
        </div>

        {!hasDbUrl && (
          <div className="mb-4 rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
            {t("DATABASE_URL is not set. Add a `DATABASE_URL` variable to `kiosk/.env.local` (eg. postgres://user:pass@host:port/db)")}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
            {t("Error querying database:")} {error}
          </div>
        )}

        {!error && (
          <div>
            {menuItems.length > 0 && (
              <div>
                <div className="mb-3 mt-1 text-2xl font-semibold">{t("Menu")}</div>
                <MenuGrid items={menuItems} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
