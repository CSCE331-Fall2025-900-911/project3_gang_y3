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
    
    // Get menu_item_id for each item by name
    const itemIds: number[] = [];
    for (const item of items) {
      if (!item.name) continue;
      const menuRes = await client.query('SELECT menu_item_id FROM menu WHERE item_name = $1', [item.name]);
      if (menuRes.rows.length > 0) {
        for (let i = 0; i < item.quantity; i++) {
          itemIds.push(menuRes.rows[0].menu_item_id);
        }
      }
    }
    const itemLink = itemIds.join(',');
    
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
    

    // Deduct inventory for all ingredients linked to each menu item
    for (const item of items) {
      if (!item.name) {
        console.error('Skipping item with no name:', item);
        continue;
      }
      try {
        // Get menu row for this item by name
        const menuRes = await client.query('SELECT menu_item_id, inventory_link FROM menu WHERE item_name = $1', [item.name]);
        if (menuRes.rows.length === 0) {
          console.error('No menu found for item name:', item.name);
          continue;
        }
        const { menu_item_id, inventory_link: linkStr } = menuRes.rows[0];
        if (!linkStr) {
          console.error('No inventory_link for menu item name:', item.name);
          continue;
        }
        // Parse inventory_link string: {id1:qty1,id2:qty2,...}
        const matches = linkStr.match(/\{([^}]*)\}/);
        if (!matches) {
          console.error('inventory_link format error for menu item name:', item.name, 'link:', linkStr);
          continue;
        }
        const pairs = matches[1].split(',').map((s: string) => s.trim()).filter(Boolean);
        let outOfStock = false;
        for (const pair of pairs) {
          const [invId, qty] = pair.split(':').map((x: string) => x.trim());
          const deductQty = (parseInt(qty) || 1) * item.quantity;
          await client.query(
            'UPDATE inventory SET quantity_in_stock = quantity_in_stock - $1 WHERE item_id = $2',
            [deductQty, parseInt(invId)]
          );
          // Check if inventory is now out of stock
          const invRes = await client.query('SELECT quantity_in_stock FROM inventory WHERE item_id = $1', [parseInt(invId)]);
          if (invRes.rows.length > 0 && invRes.rows[0].quantity_in_stock <= 0) {
            outOfStock = true;
          }
        }
        // If any ingredient is out of stock, set menu item availability to false
        if (outOfStock) {
          await client.query('UPDATE menu SET availability = false WHERE item_name = $1', [item.name]);
        } else {
          // If all ingredients are in stock, set menu item availability to true
          await client.query('UPDATE menu SET availability = true WHERE item_name = $1', [item.name]);
        }
        // Also deduct toppings if present
        if (item.custom?.toppings) {
          for (const toppingId of item.custom.toppings) {
            await client.query(
              'UPDATE inventory SET quantity_in_stock = quantity_in_stock - $1 WHERE item_id = $2',
              [item.quantity, toppingId]
            );
          }
        }
      } catch (err) {
        console.error('Error deducting inventory for item:', item, err);
      }
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
