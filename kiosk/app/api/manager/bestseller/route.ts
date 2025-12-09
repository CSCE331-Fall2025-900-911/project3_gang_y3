import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT m.item_name, COUNT(*) as sales
       FROM orders o,
       LATERAL unnest(string_to_array(o.item_link, ',')) AS menu_id_str
       JOIN menu m ON m.menu_item_id = menu_id_str::integer
       WHERE o.order_date = (NOW() AT TIME ZONE 'America/Chicago')::date
       GROUP BY m.item_name
       ORDER BY sales DESC
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ name: 'No sales yet', sales: 0 });
    }

    return NextResponse.json({
      name: result.rows[0].item_name,
      sales: parseInt(result.rows[0].sales)
    });
  } catch (error) {
    console.error('Error fetching best seller:', error);
    return NextResponse.json({ error: 'Failed to fetch best seller' }, { status: 500 });
  }
}
