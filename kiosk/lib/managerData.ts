import { pool } from './db';
// Reset X/Z report counters in the database
export async function resetReports() {
  // Example: Reset inventory update and out-of-stock counters
  // You may need to adjust table/column names to match your schema
  await pool.query('UPDATE report_counters SET out_of_stock_count = 0, x_report_hourly_sales = 0, x_report_returns = 0, x_report_voids = 0, x_report_discards = 0, x_report_payment_methods = \'{}\';');
}

export interface InventoryItem {
  item_id?: number;
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
  hourly: Array<{
    hour: number;
    sales: number;
    returns: number;
    voids: number;
    discards: number;
    paymentMethods: string[];
  }>;
}

export interface RecentOrder {
  id: number;
  time: string;
  items: number;
  total: number;
}

export interface MenuItem {
    menu_item_id: number;
    item_name: string;
    category: string;
    price: number;
    inventory_link: string;
    availability?: boolean;
}

export interface ManagerDataResponse {
  inventory: InventoryItem[];
  bestSeller: BestSeller;
  salesData: SalesData;
  recentOrders: RecentOrder[];
  totalOrdersToday: number;
  lowStockItems: InventoryItem[];
  menuItems: MenuItem[];
  categories: string[];
}

export async function getManagerData() {
      // Get hourly sales, returns, voids, discards, payment methods for today (8am-8pm)
      const hourly: Array<{ hour: number; sales: number; returns: number; voids: number; discards: number; paymentMethods: string[] }> = [];
      for (let h = 8; h <= 20; h++) {
        const start = h.toString().padStart(2, '0') + ':00:00';
        const end = h.toString().padStart(2, '0') + ':59:59';
        // Sales
        const salesRes = await pool.query(`SELECT COUNT(*) FROM orders WHERE order_date = CURRENT_DATE AND order_time BETWEEN $1 AND $2`, [start, end]);
        // Returns, Voids, Discards (assuming order_status field)
        const returnsRes = await pool.query(`SELECT COUNT(*) FROM orders WHERE order_date = CURRENT_DATE AND order_time BETWEEN $1 AND $2 AND order_status = 'Returned'`, [start, end]);
        const voidsRes = await pool.query(`SELECT COUNT(*) FROM orders WHERE order_date = CURRENT_DATE AND order_time BETWEEN $1 AND $2 AND order_status = 'Voided'`, [start, end]);
        const discardsRes = await pool.query(`SELECT COUNT(*) FROM orders WHERE order_date = CURRENT_DATE AND order_time BETWEEN $1 AND $2 AND order_status = 'Discarded'`, [start, end]);
        // Payment methods
        const paymentRes = await pool.query(`SELECT DISTINCT payment_method FROM orders WHERE order_date = CURRENT_DATE AND order_time BETWEEN $1 AND $2`, [start, end]);
        hourly.push({
          hour: h,
          sales: parseInt(salesRes.rows[0].count),
          returns: parseInt(returnsRes.rows[0].count),
          voids: parseInt(voidsRes.rows[0].count),
          discards: parseInt(discardsRes.rows[0].count),
          paymentMethods: paymentRes.rows.map(r => r.payment_method)
        });
      }
  try {
    // Get inventory
    const inventoryResult = await pool.query(
      'SELECT item_id, item_name, quantity_in_stock, unit FROM inventory ORDER BY item_name'
    );

    // Get menu items
    const menuItemsResult = await pool.query(
      'SELECT menu_item_id, item_name, category, price, inventory_link FROM menu ORDER BY category, item_name'
    );

    // Get distinct categories for dropdown
    const distinctCategoriesResult = await pool.query(
      'SELECT DISTINCT category FROM menu ORDER BY category'
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

    // Get best seller - handle item_link as either comma-separated ids or JSON-like string
    const bestSellerResult = await pool.query(`
      SELECT m.item_name, COUNT(*) as sales
      FROM orders o,
      LATERAL (
        SELECT regexp_matches(o.item_link, '\\d+', 'g') AS menu_id_arr
      ) AS ids,
      unnest(ids.menu_id_arr) AS menu_id_str
      JOIN menu m ON m.menu_item_id = menu_id_str::integer
      WHERE o.order_date = CURRENT_DATE
      GROUP BY m.item_name
      ORDER BY sales DESC
      LIMIT 1
    `);

    // Get total orders today
    const totalOrdersResult = await pool.query(
      `SELECT COUNT(*) as count FROM orders WHERE order_date = CURRENT_DATE`
    );

    // Get low stock items (less than 20 units)
    const lowStockResult = await pool.query(
      `SELECT item_name, quantity_in_stock, unit 
       FROM inventory 
       WHERE quantity_in_stock < 20 
       ORDER BY quantity_in_stock ASC 
       LIMIT 5`
    );

    // Get recent orders - count commas in item_link for number of items
    // Use order_id DESC instead of order_time to get truly latest orders
    const ordersResult = await pool.query(
      `SELECT 
        order_id,
        order_date,
        order_time AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago' as order_time_local,
        total_amount,
        (LENGTH(item_link) - LENGTH(REPLACE(item_link, ',', '')) + 1) as items
       FROM orders
       WHERE order_date = CURRENT_DATE
       ORDER BY order_id DESC
       LIMIT 10`
    );

    const recentOrders = ordersResult.rows.map(row => {
      const timeStr = row.order_time_local.toString();
      const timeParts = timeStr.split(':');
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
        topCategories,
        hourly
      } as SalesData,
      recentOrders: recentOrders as RecentOrder[],
      totalOrdersToday: parseInt(totalOrdersResult.rows[0].count),
      lowStockItems: lowStockResult.rows as InventoryItem[],
      menuItems: menuItemsResult.rows as MenuItem[],
      categories: distinctCategoriesResult.rows.map(r => r.category) as string[]
    };
  } catch (error) {
    console.error('Error fetching manager data:', error);
    return {
      inventory: [],
      bestSeller: { name: 'Error loading', sales: 0 },
      salesData: { today: 0, yesterday: 0, week: 0, topCategories: [] },
      recentOrders: [],
      totalOrdersToday: 0,
      lowStockItems: [],
      menuItems: [],
      categories: []
    };
  }
}
