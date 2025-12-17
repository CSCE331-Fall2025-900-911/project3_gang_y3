
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function POST(request: NextRequest) {
    const client = await pool.connect();
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
        }

        // In a real app, use bcrypt. Here assuming plaintext as per plan.
        const res = await client.query(
            'SELECT customer_id, first_name, last_name, points FROM customer WHERE username = $1 AND password = $2',
            [username, password]
        );

        if (res.rows.length === 0) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const customer = res.rows[0];
        return NextResponse.json({ customer });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    } finally {
        client.release();
    }
}
