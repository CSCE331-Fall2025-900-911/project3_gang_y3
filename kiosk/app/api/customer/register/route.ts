
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function POST(request: NextRequest) {
    const client = await pool.connect();
    try {
        const { username, password, firstName, lastName, phone } = await request.json();

        if (!username || !password || !firstName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await client.query('BEGIN');

        // Get next ID
        const maxIdRes = await client.query('SELECT COALESCE(MAX(customer_id), 0) + 1 as next_id FROM customer');
        const nextId = maxIdRes.rows[0].next_id;

        await client.query(
            'INSERT INTO customer (customer_id, username, password, first_name, last_name, phone_number, points) VALUES ($1, $2, $3, $4, $5, $6, 0)',
            [nextId, username, password, firstName, lastName || '', phone || '']
        );

        await client.query('COMMIT');

        return NextResponse.json({ success: true, customerId: nextId });
    } catch (error: any) {
        await client.query('ROLLBACK');
        if (error.code === '23505') { // Unique violation
            return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
        }
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    } finally {
        client.release();
    }
}
