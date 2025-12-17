import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get('customerId');

        if (!customerId) {
            return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
        }

        const result = await pool.query(
            `SELECT order_id, order_date, order_time, total_amount, payment_method, item_link, custom_id
       FROM orders 
       WHERE customer_id = $1 
       ORDER BY order_date DESC, order_time DESC 
       LIMIT 20`,
            [customerId]
        );

        // Parse item_link and custom_id to get item details
        const ordersWithItems = await Promise.all(result.rows.map(async (order) => {
            const itemIds = order.item_link ? order.item_link.split(',').map((id: string) => parseInt(id)) : [];
            const customizations = order.custom_id ? order.custom_id.split('|') : [];

            // Get item names
            const items: Array<{ name: string; quantity: number; price: number }> = [];
            if (itemIds.length > 0) {
                const itemsRes = await pool.query(
                    `SELECT menu_item_id, item_name, price FROM menu WHERE menu_item_id = ANY($1)`,
                    [itemIds]
                );

                const itemMap = new Map(itemsRes.rows.map(item => [item.menu_item_id, item]));

                // Group by item
                const itemCounts = new Map<number, number>();
                itemIds.forEach((id: number) => {
                    itemCounts.set(id, (itemCounts.get(id) || 0) + 1);
                });

                itemCounts.forEach((quantity, id) => {
                    const item = itemMap.get(id);
                    if (item) {
                        items.push({
                            name: item.item_name,
                            quantity,
                            price: item.price
                        });
                    }
                });
            }

            return {
                orderId: order.order_id,
                date: order.order_date,
                time: order.order_time,
                total: order.total_amount,
                paymentMethod: order.payment_method,
                items
            };
        }));

        return NextResponse.json({ orders: ordersWithItems });
    } catch (error) {
        console.error('Order history fetch error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
