import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

type CartItem = {
  id: number | null;
  name: string;
  price: number;
  custom?: {
    ice: 'low' | 'medium' | 'high';
    sugar: 'low' | 'medium' | 'high';
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
    
    const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
    
    const maxIdResult = await client.query('SELECT COALESCE(MAX(order_id), 0) + 1 as next_id FROM orders');
    const nextOrderId = maxIdResult.rows[0].next_id;
    
    const itemLink = items.map(item => item.id).join(',');
    
    const customId = items.map(item => {
      if (item.custom) {
        return `ice:${item.custom.ice},sugar:${item.custom.sugar}`;
      }
      return 'none';
    }).join('|');
    
    await client.query(
      `INSERT INTO orders (order_id, order_date, order_time, total_amount, payment_method, order_status, customer_id, item_link, custom_id)
       VALUES ($1, CURRENT_DATE, CURRENT_TIME, $2, $3, $4, $5, $6, $7)`,
      [nextOrderId, totalAmount, 'Cash', 'Completed', null, itemLink, customId]
    );
    
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
