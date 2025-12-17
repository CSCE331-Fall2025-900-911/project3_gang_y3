import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function POST(request: NextRequest) {
    try {
        const { customerId } = await request.json();

        if (!customerId) {
            return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
        }

        const res = await pool.query(
            'SELECT points FROM customer WHERE customer_id = $1',
            [customerId]
        );

        if (res.rows.length === 0) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        return NextResponse.json({ points: res.rows[0].points });
    } catch (error) {
        console.error('Points fetch error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
