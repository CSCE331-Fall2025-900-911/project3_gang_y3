import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT 
        order_id,
        order_date,
        order_time,
        total_amount,
        array_length(string_to_array(item_link, ','), 1) as items
       FROM orders
       WHERE order_date = (NOW() AT TIME ZONE 'America/Chicago')::date
       ORDER BY order_time DESC
       LIMIT 10`
    );

    const orders = result.rows.map(row => {
      // Parse time string (HH:MM:SS format)
      const timeParts = row.order_time.split(':');
      let hours = parseInt(timeParts[0]);
      const minutes = timeParts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12; // Convert to 12-hour format
      
      return {
        id: row.order_id,
        time: `${hours}:${minutes} ${ampm}`,
        items: row.items || 1,
        total: parseFloat(row.total_amount)
      };
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    return NextResponse.json({ error: 'Failed to fetch recent orders' }, { status: 500 });
  }
}
