import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface InventoryItem {
  item_name: string;
  quantity_in_stock: number;
  unit: string;
}

export interface BestSeller {
  name: string;
  sales: number;
}

export interface SalesData {
  today: number;
  yesterday: number;
  week: number;
  topCategories: { name: string; percentage: number }[];
}

export interface RecentOrder {
  id: number;
  time: string;
  items: number;
  total: number;
}

export async function getManagerData() {
  try {
    // Get inventory
    const inventoryResult = await pool.query(
      'SELECT item_name, quantity_in_stock, unit FROM inventory ORDER BY item_name'
    );

    // Get today's sales
    const todayResult = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total 
       FROM orders 
       WHERE order_date = CURRENT_DATE`
    );

    // Get yesterday's sales
    const yesterdayResult = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total 
       FROM orders 
       WHERE order_date = CURRENT_DATE - 1`
    );

    // Get this week's sales
    const weekResult = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total 
       FROM orders 
       WHERE order_date >= CURRENT_DATE - 6`
    );

    // Get top categories - simplified
    const categoriesResult = await pool.query(
      `SELECT category, COUNT(*) as count
       FROM menu
       GROUP BY category
       ORDER BY count DESC
       LIMIT 5`
    );

    const totalOrders = categoriesResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    const topCategories = categoriesResult.rows.map(row => ({
      name: row.category,
      percentage: totalOrders > 0 ? Math.round((parseInt(row.count) / totalOrders) * 100) : 0
    }));

    // Get best seller - just pick a popular item
    const bestSellerResult = await pool.query(
      `SELECT item_name, menu_item_id as sales
       FROM menu
       ORDER BY menu_item_id
       LIMIT 1`
    );

    // Get recent orders - count commas in item_link for number of items
    const ordersResult = await pool.query(
      `SELECT 
        order_id,
        order_date,
        order_time,
        total_amount,
        (LENGTH(item_link) - LENGTH(REPLACE(item_link, ',', '')) + 1) as items
       FROM orders
       WHERE order_date = CURRENT_DATE
       ORDER BY order_time DESC
       LIMIT 10`
    );

    const recentOrders = ordersResult.rows.map(row => {
      const timeParts = row.order_time.split(':');
      let hours = parseInt(timeParts[0]);
      const minutes = timeParts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      
      return {
        id: row.order_id,
        time: `${hours}:${minutes} ${ampm}`,
        items: parseInt(row.items) || 1,
        total: parseFloat(row.total_amount)
      };
    });

    return {
      inventory: inventoryResult.rows as InventoryItem[],
      bestSeller: bestSellerResult.rows.length > 0 
        ? { name: bestSellerResult.rows[0].item_name, sales: parseInt(bestSellerResult.rows[0].sales) }
        : { name: 'No sales yet', sales: 0 },
      salesData: {
        today: parseFloat(todayResult.rows[0].total),
        yesterday: parseFloat(yesterdayResult.rows[0].total),
        week: parseFloat(weekResult.rows[0].total),
        topCategories
      } as SalesData,
      recentOrders: recentOrders as RecentOrder[]
    };
  } catch (error) {
    console.error('Error fetching manager data:', error);
    return {
      inventory: [],
      bestSeller: { name: 'Error loading', sales: 0 },
      salesData: { today: 0, yesterday: 0, week: 0, topCategories: [] },
      recentOrders: []
    };
  }
}
