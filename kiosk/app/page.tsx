import { getMenuItems } from "../lib/db";
import HomeClient from "../components/HomeClient";

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
    <HomeClient 
      menuItems={menuItems} 
      error={error} 
      hasDbUrl={!!process.env.DATABASE_URL}
    />
  );
}
