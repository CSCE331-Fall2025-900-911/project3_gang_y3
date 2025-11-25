import { getMenuItems } from "../../lib/db";
import CashierClient from "./CashierClient";

type MenuItem = { id: number | null; name: string; price: number; category?: string | null };

export default async function CashierView() {
  let menuItems: MenuItem[] = [];
  try {
    menuItems = await getMenuItems();
  } catch (e) {
    console.warn('getMenuItems failed', e);
  }

  return <CashierClient menuItems={menuItems} />;
}
