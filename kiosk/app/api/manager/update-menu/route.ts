import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: Request) {
  try {
    const { menuItemId, price, inventoryLink } = await request.json();

    if (!menuItemId || price === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update price and optionally inventory_link
    if (inventoryLink !== undefined) {
      await pool.query(
        'UPDATE menu SET price = $1, inventory_link = $2 WHERE menu_item_id = $3',
        [price, inventoryLink, menuItemId]
      );
    } else {
      await pool.query(
        'UPDATE menu SET price = $1 WHERE menu_item_id = $2',
        [price, menuItemId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating menu:', error);
    return NextResponse.json({ error: 'Failed to update menu' }, { status: 500 });
  }
}
