import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

type CartItem = {
  id: number | null;
  name: string;
  price: number;
  quantity: number;
  custom?: {
    temperature: 'hot' | 'cold';
    ice: 'low' | 'medium' | 'high';
    sugar: 'low' | 'medium' | 'high';
    toppings?: number[];
  };
};

export async function POST(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    const { items }: { items: CartItem[] } = await request.json();
    
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }
    
    await client.query('BEGIN');
    
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const maxIdResult = await client.query('SELECT COALESCE(MAX(order_id), 0) + 1 as next_id FROM orders');
    const nextOrderId = maxIdResult.rows[0].next_id;
    
    const itemLink = items.map(item => item.id).join(',');
    
    const customId = items.map(item => {
      if (item.custom) {
        const toppingsStr = item.custom.toppings ? `toppings:${item.custom.toppings.join(',')}` : '';
        return `qty:${item.quantity},temp:${item.custom.temperature},ice:${item.custom.ice},sugar:${item.custom.sugar}${toppingsStr ? ',' + toppingsStr : ''}`;
      }
      return `qty:${item.quantity}`;
    }).join('|');
    
    await client.query(
      `INSERT INTO orders (order_id, order_date, order_time, total_amount, payment_method, order_status, customer_id, item_link, custom_id)
       VALUES ($1, CURRENT_DATE, CURRENT_TIME, $2, $3, $4, $5, $6, $7)`,
      [nextOrderId, totalAmount, 'Cash', 'Completed', null, itemLink, customId]
    );
    
    // Decrease inventory for each topping used
    const allToppings: number[] = [];
    items.forEach(item => {
      if (item.custom?.toppings) {
        // Multiply toppings by quantity of the item
        for (let i = 0; i < item.quantity; i++) {
          allToppings.push(...item.custom.toppings);
        }
      }
    });
    
    // Count occurrences of each topping
    const toppingCounts = allToppings.reduce((acc, toppingId) => {
      acc[toppingId] = (acc[toppingId] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    // Update inventory for each topping
    for (const [toppingId, count] of Object.entries(toppingCounts)) {
      await client.query(
        `UPDATE inventory SET quantity_in_stock = quantity_in_stock - $1 WHERE item_id = $2`,
        [count, parseInt(toppingId)]
      );
    }
    
    await client.query('COMMIT');
    
    return NextResponse.json({ 
      success: true, 
      orderId: nextOrderId,
      totalAmount: totalAmount 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Order placement error:', error);
    return NextResponse.json({ 
      error: 'Failed to place order',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  } finally {
    client.release();
  }
}
