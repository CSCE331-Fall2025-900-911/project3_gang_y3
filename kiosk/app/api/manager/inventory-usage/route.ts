import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    if (!start || !end) {
      console.error('Inventory Usage API: Missing start or end datetime', { start, end });
      return NextResponse.json({ error: 'Missing start or end datetime' }, { status: 400 });
    }
    const usageMap = new Map();
    let ordersRes;
    try {
      ordersRes = await pool.query(
        `SELECT item_link FROM orders WHERE TO_TIMESTAMP(order_date || ' ' || order_time, 'YYYY-MM-DD HH24:MI:SS') >= $1::timestamp AND TO_TIMESTAMP(order_date || ' ' || order_time, 'YYYY-MM-DD HH24:MI:SS') <= $2::timestamp`,
        [start, end]
      );
    } catch (err) {
      console.error('Inventory Usage API: Error querying orders', err);
      return NextResponse.json({ error: 'Error querying orders', details: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
    for (const row of ordersRes.rows) {
      if (!row.item_link) {
        console.warn('Inventory Usage API: Order missing item_link', row);
        continue;
      }
      let parsed;
      try {
        parsed = JSON.parse(row.item_link);
      } catch (err) {
        console.warn('Inventory Usage API: item_link JSON parse error', row.item_link);
        continue;
      }
      for (const invId in parsed) {
        const qty = parsed[invId];
        if (!invId || !qty) {
          console.warn('Inventory Usage API: Malformed inventory pair', invId, qty);
          continue;
        }
        usageMap.set(invId, (usageMap.get(invId) || 0) + parseInt(qty));
      }
    }
    const usage = [];
    if (usageMap.size > 0) {
      // Remove quotes from IDs if present
      const ids = Array.from(usageMap.keys())
        .map(id => typeof id === 'string' ? id.replace(/"/g, '') : id)
        .filter(id => /^\d+$/.test(id))
        .map(id => parseInt(id));
      if (ids.length > 0) {
        let invRes;
        try {
          invRes = await pool.query(
            `SELECT item_id, item_name, unit FROM inventory WHERE item_id = ANY($1::int[])`,
            [ids]
          );
        } catch (err) {
          console.error('Inventory Usage API: Error querying inventory', err);
          return NextResponse.json({ error: 'Error querying inventory', details: err instanceof Error ? err.message : String(err) }, { status: 500 });
        }
        for (const inv of invRes.rows) {
          const used = usageMap.get(inv.item_id) ?? usageMap.get(inv.item_id.toString()) ?? 0;
          usage.push({ item_name: inv.item_name, used, unit: inv.unit });
        }
      } else {
        console.warn('Inventory Usage API: No valid inventory IDs found', Array.from(usageMap.keys()));
      }
    } else {
      console.warn('Inventory Usage API: No inventory usage found for orders in range', { start, end });
    }
    return NextResponse.json({ usage });
  } catch (error) {
    console.error('Inventory Usage API: Unexpected error', error);
    return NextResponse.json({ error: 'Unexpected error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
