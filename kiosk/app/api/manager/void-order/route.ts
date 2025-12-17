import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../../lib/db';

export async function POST(request: NextRequest) {
    try {
        const { orderId } = await request.json();

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        // Update order status to 'Voided'
        const result = await pool.query(
            'UPDATE orders SET order_status = $1 WHERE order_id = $2 RETURNING order_id',
            ['Voided', orderId]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, orderId: result.rows[0].order_id });
    } catch (error) {
        console.error('Error voiding order:', error);
        return NextResponse.json(
            { error: 'Failed to void order', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
