"use server";

import Image from "next/image";
import { getMenuItems } from "../lib/db";
import MenuGrid from "../components/MenuGrid";

type MenuItem = { id: number | null; name: string; price: number; category?: string | null };

export default async function Home() {
  let error: string | null = null;
  let menuItems: MenuItem[] = [];
  if (!error) {
    try {
      menuItems = await getMenuItems();
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      console.warn('getMenuItems failed', e);
    }
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 font-sans dark:bg-black p-8 text-black">
      <main className="w-full max-w-3xl bg-white p-8 shadow rounded text-black">
        <div className="flex items-center gap-4 mb-6">
          <Image className="dark:invert" src="/next.svg" alt="Next.js" width={56} height={14} priority />
          <h1 className="text-2xl font-semibold">Kiosk — Place an order</h1>
        </div>

        {!process.env.DATABASE_URL && (
          <div className="mb-4 rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
            DATABASE_URL is not set. Add a `DATABASE_URL` variable to `kiosk/.env.local` (eg. postgres://user:pass@host:port/db)
          </div>
        )}

        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
            Error querying database: {error}
          </div>
        )}

        {!error && (
          <div>
            {menuItems.length > 0 && (
              <div>
                <div className="mb-3 font-medium">Menu</div>
                <MenuGrid items={menuItems} />
              </div>
            )}
            { }
          </div>
        )}
      </main>
    </div>
  );
}
