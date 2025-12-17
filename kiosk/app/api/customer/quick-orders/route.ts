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
            `SELECT quick_order_id, order_name, items_data, created_at
       FROM quick_orders 
       WHERE customer_id = $1 
       ORDER BY created_at DESC`,
            [customerId]
        );

        return NextResponse.json({ quickOrders: result.rows });
    } catch (error) {
        console.error('Quick orders fetch error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { customerId, orderName, items } = await request.json();

        if (!customerId || !orderName || !items) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await pool.query(
            `INSERT INTO quick_orders (customer_id, order_name, items_data) 
       VALUES ($1, $2, $3) 
       RETURNING quick_order_id`,
            [customerId, orderName, JSON.stringify(items)]
        );

        return NextResponse.json({ success: true, quickOrderId: result.rows[0].quick_order_id });
    } catch (error) {
        console.error('Quick order save error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const quickOrderId = searchParams.get('quickOrderId');
        const customerId = searchParams.get('customerId');

        if (!quickOrderId || !customerId) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // Verify ownership before deleting
        await pool.query(
            `DELETE FROM quick_orders WHERE quick_order_id = $1 AND customer_id = $2`,
            [quickOrderId, customerId]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Quick order delete error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
