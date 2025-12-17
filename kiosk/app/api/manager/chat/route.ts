import { NextResponse } from 'next/server';
import { pool } from '../../../../lib/db';

// Simple query interpreter for common business questions
async function interpretAndQuery(question: string): Promise<string> {
    const q = question.toLowerCase().trim();

    try {
        // Sales-related questions
        if (q.includes('total sales') || q.includes('how much') && q.includes('today')) {
            const result = await pool.query(
                'SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE order_date = CURRENT_DATE'
            );
            return `Today's total sales: $${parseFloat(result.rows[0].total).toFixed(2)}`;
        }

        if (q.includes('yesterday') && (q.includes('sales') || q.includes('revenue'))) {
            const result = await pool.query(
                'SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE order_date = CURRENT_DATE - 1'
            );
            return `Yesterday's total sales: $${parseFloat(result.rows[0].total).toFixed(2)}`;
        }

        if (q.includes('this week') && (q.includes('sales') || q.includes('revenue'))) {
            const result = await pool.query(
                'SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE order_date >= CURRENT_DATE - 6'
            );
            return `This week's total sales: $${parseFloat(result.rows[0].total).toFixed(2)}`;
        }

        // Order count questions
        if (q.includes('how many orders') || q.includes('order count') || q.includes('total orders')) {
            if (q.includes('yesterday')) {
                const result = await pool.query(
                    'SELECT COUNT(*) as count FROM orders WHERE order_date = CURRENT_DATE - 1'
                );
                return `Yesterday's order count: ${result.rows[0].count} orders`;
            }
            const result = await pool.query(
                'SELECT COUNT(*) as count FROM orders WHERE order_date = CURRENT_DATE'
            );
            return `Today's order count: ${result.rows[0].count} orders`;
        }

        // Best seller questions
        if (q.includes('best seller') || q.includes('top selling') || q.includes('most popular')) {
            const result = await pool.query(`
        SELECT m.item_name, COUNT(*) as sales
        FROM orders o,
        LATERAL (SELECT regexp_matches(o.item_link, '\\d+', 'g') AS menu_id_arr) AS ids,
        unnest(ids.menu_id_arr) AS menu_id_str
        JOIN menu m ON m.menu_item_id = menu_id_str::integer
        WHERE o.order_date = CURRENT_DATE
        GROUP BY m.item_name
        ORDER BY sales DESC
        LIMIT 1
      `);
            if (result.rows.length > 0) {
                return `Today's best seller: ${result.rows[0].item_name} with ${result.rows[0].sales} orders`;
            }
            return `No sales data available for today yet.`;
        }

        // Inventory questions
        if (q.includes('low stock') || q.includes('running low')) {
            const result = await pool.query(
                'SELECT item_name, quantity_in_stock, unit FROM inventory WHERE quantity_in_stock < 20 ORDER BY quantity_in_stock ASC LIMIT 5'
            );
            if (result.rows.length === 0) {
                return 'All items are well stocked!';
            }
            const items = result.rows.map(r => `${r.item_name}: ${r.quantity_in_stock} ${r.unit}`).join(', ');
            return `Low stock items: ${items}`;
        }

        if (q.includes('out of stock')) {
            const result = await pool.query(
                'SELECT item_name FROM inventory WHERE quantity_in_stock <= 0'
            );
            if (result.rows.length === 0) {
                return 'No items are currently out of stock!';
            }
            return `Out of stock: ${result.rows.map(r => r.item_name).join(', ')}`;
        }

        // Staff questions
        if (q.includes('how many staff') || q.includes('staff count') || q.includes('employees')) {
            const result = await pool.query(
                "SELECT role, COUNT(*) as count FROM authentication WHERE role IN ('Cashier', 'Manager') GROUP BY role"
            );
            const staff = result.rows.map(r => `${r.count} ${r.role}(s)`).join(', ');
            return `Staff count: ${staff}`;
        }

        // Payment method questions
        if (q.includes('cash') && q.includes('card')) {
            const result = await pool.query(`
        SELECT 
          SUM(CASE WHEN LOWER(payment_method) = 'cash' THEN 1 ELSE 0 END) as cash_count,
          SUM(CASE WHEN LOWER(payment_method) = 'card' THEN 1 ELSE 0 END) as card_count
        FROM orders WHERE order_date = CURRENT_DATE
      `);
            return `Today: ${result.rows[0].cash_count || 0} cash orders, ${result.rows[0].card_count || 0} card orders`;
        }

        if (q.includes('cash') && (q.includes('total') || q.includes('amount'))) {
            const result = await pool.query(`
        SELECT COALESCE(SUM(total_amount), 0) as total 
        FROM orders 
        WHERE order_date = CURRENT_DATE AND LOWER(payment_method) = 'cash'
      `);
            return `Today's cash sales: $${parseFloat(result.rows[0].total).toFixed(2)}`;
        }

        if (q.includes('card') && (q.includes('total') || q.includes('amount'))) {
            const result = await pool.query(`
        SELECT COALESCE(SUM(total_amount), 0) as total 
        FROM orders 
        WHERE order_date = CURRENT_DATE AND LOWER(payment_method) = 'card'
      `);
            return `Today's card sales: $${parseFloat(result.rows[0].total).toFixed(2)}`;
        }

        // Voided orders
        if (q.includes('void') || q.includes('voided')) {
            const result = await pool.query(
                "SELECT COUNT(*) as count FROM orders WHERE order_date = CURRENT_DATE AND order_status = 'Voided'"
            );
            return `Voided orders today: ${result.rows[0].count}`;
        }

        // Average order value
        if (q.includes('average') && (q.includes('order') || q.includes('ticket'))) {
            const result = await pool.query(`
        SELECT COALESCE(AVG(total_amount), 0) as avg 
        FROM orders 
        WHERE order_date = CURRENT_DATE
      `);
            return `Average order value today: $${parseFloat(result.rows[0].avg).toFixed(2)}`;
        }

        // Menu items count
        if (q.includes('menu') && (q.includes('how many') || q.includes('count'))) {
            const result = await pool.query('SELECT COUNT(*) as count FROM menu');
            return `Total menu items: ${result.rows[0].count}`;
        }

        // Categories
        if (q.includes('categories') || q.includes('category')) {
            const result = await pool.query('SELECT DISTINCT category FROM menu ORDER BY category');
            return `Menu categories: ${result.rows.map(r => r.category).join(', ')}`;
        }

        // Peak hour
        if (q.includes('busiest') || q.includes('peak hour') || q.includes('rush hour')) {
            const result = await pool.query(`
        SELECT EXTRACT(HOUR FROM order_time) as hour, COUNT(*) as count 
        FROM orders 
        WHERE order_date = CURRENT_DATE 
        GROUP BY hour 
        ORDER BY count DESC 
        LIMIT 1
      `);
            if (result.rows.length > 0) {
                const hour = parseInt(result.rows[0].hour);
                const displayHour = hour > 12 ? `${hour - 12}pm` : hour === 12 ? '12pm' : `${hour}am`;
                return `Busiest hour today: ${displayHour} with ${result.rows[0].count} orders`;
            }
            return 'No orders today yet.';
        }

        // Default response
        return "I can help with questions about sales, orders, inventory, staff, and more. Try asking:\n• What are today's total sales?\n• How many orders today?\n• What's the best seller?\n• Any low stock items?\n• How many staff members?\n• Cash vs card breakdown?";

    } catch (error) {
        console.error('Query error:', error);
        return 'Sorry, I had trouble processing that question. Please try rephrasing.';
    }
}

export async function POST(request: Request) {
    try {
        const { question } = await request.json();

        if (!question || typeof question !== 'string') {
            return NextResponse.json({ error: 'Question is required' }, { status: 400 });
        }

        const answer = await interpretAndQuery(question);
        return NextResponse.json({ answer });

    } catch (error) {
        console.error('Chat error:', error);
        return NextResponse.json({ error: 'Failed to process question' }, { status: 500 });
    }
}
