
import { getMenuItems } from "../../lib/db";
import CashierPageClient from './CashierPageClient';

type MenuItem = { id: number | null; name: string; price: number; category?: string | null };

export default async function CashierPage() {
  let menuItems: MenuItem[] = [];
  try {
    menuItems = await getMenuItems();
  } catch (e) {
    console.warn('getMenuItems failed', e);
  }
  return <CashierPageClient menuItems={menuItems} />;
}
