import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: Request) {
  try {
    const { itemName, quantity } = await request.json();

    if (!itemName || quantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update inventory quantity
    await pool.query(
      'UPDATE inventory SET quantity_in_stock = $1 WHERE item_name = $2',
      [quantity, itemName]
    );

    // Find the item_id for this inventory item
    const invRes = await pool.query('SELECT item_id FROM inventory WHERE item_name = $1', [itemName]);
    if (invRes.rows.length === 0) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }
    const itemId = invRes.rows[0].item_id;

    // Find all menu items that use this inventory item in their inventory_link
    const menuRes = await pool.query('SELECT item_name, inventory_link FROM menu');
    for (const menuRow of menuRes.rows) {
      const { item_name: menuItemName, inventory_link: linkStr } = menuRow;
      if (!linkStr) continue;
      // Parse inventory_link string: {id1:qty1,id2:qty2,...}
      const matches = linkStr.match(/\{([^}]*)\}/);
      if (!matches) continue;
      const pairs = matches[1].split(',').map((s: string) => s.trim()).filter(Boolean);
      let allInStock = true;
      for (const pair of pairs) {
        const [invId, qty] = pair.split(':').map((x: string) => x.trim());
        // Check inventory for each ingredient
        const invCheck = await pool.query('SELECT quantity_in_stock FROM inventory WHERE item_id = $1', [parseInt(invId)]);
        if (invCheck.rows.length === 0 || invCheck.rows[0].quantity_in_stock <= 0) {
          allInStock = false;
          break;
        }
      }
      // If all ingredients are in stock, set menu item availability to true
      if (allInStock) {
        await pool.query('UPDATE menu SET availability = true WHERE item_name = $1', [menuItemName]);
      } else {
        // If any ingredient is out of stock, set menu item availability to false
        await pool.query('UPDATE menu SET availability = false WHERE item_name = $1', [menuItemName]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating inventory:', error);
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
  }
}
