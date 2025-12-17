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
  pointsCost?: number;
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
    const { items, customerId, paymentMethod }: { items: CartItem[], customerId?: number, paymentMethod?: string } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Validate payment method
    const validPaymentMethod = paymentMethod === 'Card' ? 'Card' : 'Cash';

    // Check for point redemptions
    let totalPointsCost = 0;
    for (const item of items) {
      if (item.pointsCost && item.pointsCost > 0) {
        totalPointsCost += item.pointsCost * item.quantity;
      }
    }

    if (totalPointsCost > 0) {
      if (!customerId) {
        return NextResponse.json({ error: 'Customer ID required for rewards' }, { status: 400 });
      }
      // Verify points balance
      const custRes = await client.query('SELECT points FROM customer WHERE customer_id = $1', [customerId]);
      if (custRes.rows.length === 0 || custRes.rows[0].points < totalPointsCost) {
        return NextResponse.json({ error: 'Insufficient points for rewards' }, { status: 400 });
      }
    }

    // --- NEW: Pre-order Inventory Check ---
    // Map of inventory_item_id -> required_quantity
    const inventoryRequirements = new Map<number, number>();

    for (const item of items) {
      if (!item.name) continue;

      // 1. Get ingredients for the menu item
      const menuRes = await client.query('SELECT menu_item_id, item_name, inventory_link FROM menu WHERE item_name = $1', [item.name]);
      if (menuRes.rows.length === 0) {
        return NextResponse.json({ error: `Menu item not found: ${item.name}` }, { status: 400 });
      }

      const { inventory_link } = menuRes.rows[0];
      if (inventory_link) {
        const matches = inventory_link.match(/\{([^}]*)\}/);
        if (matches) {
          const pairs = matches[1].split(',').map((s: string) => s.trim()).filter(Boolean);
          for (const pair of pairs) {
            const [invIdStr, qtyStr] = pair.split(':');
            const invId = parseInt(invIdStr);
            const qtyPerItem = parseInt(qtyStr) || 1;
            const totalQty = qtyPerItem * item.quantity;

            inventoryRequirements.set(invId, (inventoryRequirements.get(invId) || 0) + totalQty);
          }
        }
      }

      // 2. Get ingredients for toppings
      if (item.custom?.toppings) {
        for (const toppingId of item.custom.toppings) {
          // Assuming toppingId maps directly to inventory item_id 
          // (based on previous code usage: UPDATE inventory ... WHERE item_id = toppingId)
          inventoryRequirements.set(toppingId, (inventoryRequirements.get(toppingId) || 0) + item.quantity);
        }
      }
    }

    // 3. Verify stock in database
    if (inventoryRequirements.size > 0) {
      const ids = Array.from(inventoryRequirements.keys());
      const stockRes = await client.query(
        'SELECT item_id, item_name, quantity_in_stock FROM inventory WHERE item_id = ANY($1)',
        [ids]
      );

      const stockMap = new Map();
      stockRes.rows.forEach(row => {
        stockMap.set(row.item_id, { name: row.item_name, stock: row.quantity_in_stock });
      });

      for (const [id, required] of inventoryRequirements.entries()) {
        const itemData = stockMap.get(id);

        if (!itemData) {
          // Inventory item missing from DB?
          return NextResponse.json({ error: `System Error: Inventory item ${id} not found.` }, { status: 500 });
        }

        if (itemData.stock < required) {
          return NextResponse.json({
            error: `Out of stock: ${itemData.name}. (Available: ${itemData.stock}, Required: ${required})`
          }, { status: 400 });
        }
      }
    }
    // --------------------------------------

    await client.query('BEGIN');

    // Deduct points first if needed
    if (totalPointsCost > 0 && customerId) {
      await client.query(
        'UPDATE customer SET points = points - $1 WHERE customer_id = $2',
        [totalPointsCost, customerId]
      );
      console.log(`[Points System] Deducted ${totalPointsCost} points for rewards.`);
    }

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
      [nextOrderId, totalAmount, validPaymentMethod, 'Completed', customerId || null, itemLink, customId]
    );

    // Update customer points if customerId is present
    if (customerId) {
      console.log(`[Points System] Processing points for customerId: ${customerId}`);
      // 10 points per $1
      const pointsEarned = Math.floor(totalAmount * 10);
      console.log(`[Points System] Order Total: ${totalAmount}, Points Earned: ${pointsEarned}`);

      const updateRes = await client.query(
        'UPDATE customer SET points = COALESCE(points, 0) + $1 WHERE customer_id = $2 RETURNING points',
        [pointsEarned, customerId]
      );
      console.log(`[Points System] Updated points. New Balance: ${updateRes.rows[0]?.points}`);
    } else {
      console.log('[Points System] No customerId provided in order.');
    }


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
