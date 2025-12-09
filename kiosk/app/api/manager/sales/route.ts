import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  try {
    console.log('Fetching sales data...');
    
    // Get today's sales (using local timezone)
    const todayResult = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total 
       FROM orders 
       WHERE order_date = (NOW() AT TIME ZONE 'America/Chicago')::date`
    );
    console.log('Today sales:', todayResult.rows[0]);

    // Get yesterday's sales
    const yesterdayResult = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total 
       FROM orders 
       WHERE order_date = (NOW() AT TIME ZONE 'America/Chicago' - INTERVAL '1 day')::date`
    );

    // Get this week's sales
    const weekResult = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total 
       FROM orders 
       WHERE order_date >= (NOW() AT TIME ZONE 'America/Chicago' - INTERVAL '7 days')::date`
    );

    // Get top categories by parsing item_link and joining with menu
    const categoriesResult = await pool.query(
      `SELECT m.category, COUNT(*) as count
       FROM orders o,
       LATERAL unnest(string_to_array(o.item_link, ',')) AS menu_id_str
       JOIN menu m ON m.menu_item_id = menu_id_str::integer
       WHERE o.order_date = (NOW() AT TIME ZONE 'America/Chicago')::date
       GROUP BY m.category
       ORDER BY count DESC
       LIMIT 5`
    );

    const totalOrders = categoriesResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    const topCategories = categoriesResult.rows.map(row => ({
      name: row.category,
      percentage: totalOrders > 0 ? Math.round((parseInt(row.count) / totalOrders) * 100) : 0
    }));

    const response = {
      today: parseFloat(todayResult.rows[0].total),
      yesterday: parseFloat(yesterdayResult.rows[0].total),
      week: parseFloat(weekResult.rows[0].total),
      topCategories
    };
    
    console.log('Sales response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return NextResponse.json({ error: 'Failed to fetch sales data', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
