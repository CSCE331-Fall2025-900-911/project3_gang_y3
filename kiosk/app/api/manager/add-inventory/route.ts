import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: Request) {
  try {
    const { itemName, quantity, unit } = await request.json();

    if (!itemName || quantity === undefined || !unit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the next item_id
    const maxIdResult = await pool.query('SELECT COALESCE(MAX(item_id), 0) + 1 as next_id FROM inventory');
    const nextId = maxIdResult.rows[0].next_id;

    // Set default thresholds
    const redThreshold = 10;
    const yellowThreshold = 25;

    await pool.query(
      'INSERT INTO inventory (item_id, item_name, quantity_in_stock, unit, red_threshold, yellow_threshold) VALUES ($1, $2, $3, $4, $5, $6)',
      [nextId, itemName, quantity, unit, redThreshold, yellowThreshold]
    );

    return NextResponse.json({ success: true, itemId: nextId });
  } catch (error) {
    console.error('Error adding inventory item:', error);
    return NextResponse.json({ error: 'Failed to add inventory item' }, { status: 500 });
  }
}
