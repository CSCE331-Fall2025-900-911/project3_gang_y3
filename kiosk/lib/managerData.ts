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
    cash: number;
    card: number;
    paymentMethods: string[];
  }>;
}

export interface RecentOrder {
  id: number;
  time: string;
  items: number;
  total: number;
  paymentMethod: string;
  orderStatus: string;
}

export interface MenuItem {
  menu_item_id: number;
  item_name: string;
  category: string;
  price: number;
  inventory_link: string;
  availability?: boolean;
}

export interface PaymentBreakdown {
  cash: { count: number; total: number };
  card: { count: number; total: number };
}

export interface Staff {
  user_id: number;
  username: string;
  email: string;
  role: string;
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
  paymentBreakdown: PaymentBreakdown;
  staff: Staff[];
}

export async function getManagerData() {
  try {
    const [
      inventoryResult,
      menuItemsResult,
      distinctCategoriesResult,
      todayResult,
      yesterdayResult,
      weekResult,
      categoriesResult,
      bestSellerResult,
      totalOrdersResult,
      lowStockResult,
      recentOrdersResult,
      hourlyResult,
      paymentBreakdownResult,
      staffResult
    ] = await Promise.all([
      // Inventory
      pool.query('SELECT item_id, item_name, quantity_in_stock, unit FROM inventory ORDER BY item_name'),

      // Menu Items
      pool.query('SELECT menu_item_id, item_name, category, price, inventory_link FROM menu ORDER BY category, item_name'),

      // Distinct Categories
      pool.query('SELECT DISTINCT category FROM menu ORDER BY category'),

      // Today Sales
      pool.query('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE order_date = CURRENT_DATE'),

      // Yesterday Sales
      pool.query('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE order_date = CURRENT_DATE - 1'),

      // Week Sales
      pool.query('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE order_date >= CURRENT_DATE - 6'),

      // Top Categories
      pool.query(`SELECT category, COUNT(*) as count FROM menu GROUP BY category ORDER BY count DESC LIMIT 5`),

      // Best Seller
      pool.query(`
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
      `),

      // Total Orders Today
      pool.query('SELECT COUNT(*) as count FROM orders WHERE order_date = CURRENT_DATE'),

      // Low Stock
      pool.query(`SELECT item_name, quantity_in_stock, unit FROM inventory WHERE quantity_in_stock < 20 ORDER BY quantity_in_stock ASC LIMIT 5`),

      // Recent Orders
      pool.query(`
        SELECT 
          order_id,
          order_date,
          order_time AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago' as order_time_local,
          total_amount,
          payment_method,
          order_status,
          (LENGTH(item_link) - LENGTH(REPLACE(item_link, ',', '')) + 1) as items
        FROM orders
        WHERE order_date = CURRENT_DATE
        ORDER BY order_id DESC
        LIMIT 10
      `),

      // Hourly Data
      pool.query(`
        SELECT 
            EXTRACT(HOUR FROM order_time) as hour,
            COUNT(*) as sales,
            SUM(CASE WHEN order_status = 'Returned' THEN 1 ELSE 0 END) as returns,
            SUM(CASE WHEN order_status = 'Voided' THEN 1 ELSE 0 END) as voids,
            SUM(CASE WHEN order_status = 'Discarded' THEN 1 ELSE 0 END) as discards,
            SUM(CASE WHEN LOWER(payment_method) = 'cash' THEN 1 ELSE 0 END) as cash,
            SUM(CASE WHEN LOWER(payment_method) = 'card' THEN 1 ELSE 0 END) as card,
            array_agg(DISTINCT payment_method) as payment_methods
        FROM orders 
        WHERE order_date = CURRENT_DATE 
            AND order_time >= '08:00:00' 
            AND order_time <= '20:59:59'
        GROUP BY EXTRACT(HOUR FROM order_time)
      `),

      // Payment Breakdown (Cash vs Card)
      pool.query(`
        SELECT 
          COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'cash' THEN 1 ELSE 0 END), 0) as cash_count,
          COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'cash' THEN total_amount ELSE 0 END), 0) as cash_total,
          COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'card' THEN 1 ELSE 0 END), 0) as card_count,
          COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'card' THEN total_amount ELSE 0 END), 0) as card_total
        FROM orders 
        WHERE order_date = CURRENT_DATE
      `),

      // Staff (Cashiers and Managers)
      pool.query(`
        SELECT user_id, username, email, role 
        FROM authentication 
        WHERE role IN ('Cashier', 'Manager')
        ORDER BY role, username
      `)
    ]);

    // Process Top Categories
    const totalOrders = categoriesResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    const topCategories = categoriesResult.rows.map(row => ({
      name: row.category,
      percentage: totalOrders > 0 ? Math.round((parseInt(row.count) / totalOrders) * 100) : 0
    }));

    // Process Recent Orders
    const recentOrders = recentOrdersResult.rows.map(row => {
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
        total: parseFloat(row.total_amount),
        paymentMethod: row.payment_method || 'Cash',
        orderStatus: row.order_status || 'Completed'
      };
    });

    // Process Hourly Data
    const hourlyDataMap = new Map();
    hourlyResult.rows.forEach(row => {
      hourlyDataMap.set(parseInt(row.hour), {
        sales: parseInt(row.sales),
        returns: parseInt(row.returns),
        voids: parseInt(row.voids),
        discards: parseInt(row.discards),
        cash: parseInt(row.cash) || 0,
        card: parseInt(row.card) || 0,
        paymentMethods: row.payment_methods || []
      });
    });

    const hourly: Array<{ hour: number; sales: number; returns: number; voids: number; discards: number; cash: number; card: number; paymentMethods: string[] }> = [];
    for (let h = 8; h <= 20; h++) {
      const data = hourlyDataMap.get(h) || { sales: 0, returns: 0, voids: 0, discards: 0, cash: 0, card: 0, paymentMethods: [] };
      hourly.push({
        hour: h,
        ...data
      });
    }

    // Process Payment Breakdown
    const paymentRow = paymentBreakdownResult.rows[0] || {};
    const paymentBreakdown = {
      cash: {
        count: parseInt(paymentRow.cash_count) || 0,
        total: parseFloat(paymentRow.cash_total) || 0
      },
      card: {
        count: parseInt(paymentRow.card_count) || 0,
        total: parseFloat(paymentRow.card_total) || 0
      }
    };

    // Process Staff
    const staff = staffResult.rows.map(row => ({
      user_id: row.user_id,
      username: row.username,
      email: row.email || '',
      role: row.role
    }));

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
      categories: distinctCategoriesResult.rows.map(r => r.category) as string[],
      paymentBreakdown,
      staff
    };

  } catch (error) {
    console.error('Error fetching manager data:', error);
    return {
      inventory: [],
      bestSeller: { name: 'Error loading', sales: 0 },
      salesData: {
        today: 0,
        yesterday: 0,
        week: 0,
        topCategories: [],
        hourly: [],
      },
      recentOrders: [],
      totalOrdersToday: 0,
      lowStockItems: [],
      menuItems: [],
      categories: [],
      paymentBreakdown: { cash: { count: 0, total: 0 }, card: { count: 0, total: 0 } },
      staff: []
    };
  }
}
