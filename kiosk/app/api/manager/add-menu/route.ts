import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: Request) {
  try {
    const { itemName, category, price, inventoryLink } = await request.json();

    if (!itemName || !category || price === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the next menu_item_id
    const maxIdResult = await pool.query('SELECT COALESCE(MAX(menu_item_id), 0) + 1 as next_id FROM menu');
    const nextId = maxIdResult.rows[0].next_id;

    await pool.query(
      'INSERT INTO menu (menu_item_id, item_name, category, price, availability, inventory_link) VALUES ($1, $2, $3, $4, $5, $6)',
      [nextId, itemName, category, price, true, inventoryLink || '{}']
    );

    return NextResponse.json({ success: true, menuItemId: nextId });
  } catch (error) {
    console.error('Error adding menu item:', error);
    return NextResponse.json({ error: 'Failed to add menu item' }, { status: 500 });
  }
}
