import { NextResponse } from 'next/server';
import { pool } from '../../../../lib/db';

// GET - Fetch all staff (cashiers and managers)
export async function GET() {
    try {
        const result = await pool.query(`
      SELECT user_id, username, email, role 
      FROM authentication 
      WHERE role IN ('Cashier', 'Manager')
      ORDER BY role, username
    `);
        return NextResponse.json({ staff: result.rows });
    } catch (error) {
        console.error('Error fetching staff:', error);
        return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
    }
}

// POST - Add new staff member
export async function POST(request: Request) {
    try {
        const { username, email, role, password } = await request.json();

        if (!username || !role) {
            return NextResponse.json({ error: 'Username and role are required' }, { status: 400 });
        }

        if (!['Cashier', 'Manager'].includes(role)) {
            return NextResponse.json({ error: 'Role must be Cashier or Manager' }, { status: 400 });
        }

        const result = await pool.query(
            `INSERT INTO authentication (username, email, role, password) 
       VALUES ($1, $2, $3, $4) 
       RETURNING user_id, username, email, role`,
            [username, email || '', role, password || 'default123']
        );

        return NextResponse.json({ staff: result.rows[0] });
    } catch (error) {
        console.error('Error adding staff:', error);
        return NextResponse.json({ error: 'Failed to add staff' }, { status: 500 });
    }
}

// PUT - Update staff role
export async function PUT(request: Request) {
    try {
        const { userId, role } = await request.json();

        if (!userId || !role) {
            return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 });
        }

        if (!['Cashier', 'Manager'].includes(role)) {
            return NextResponse.json({ error: 'Role must be Cashier or Manager' }, { status: 400 });
        }

        await pool.query(
            'UPDATE authentication SET role = $1 WHERE user_id = $2',
            [role, userId]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating staff:', error);
        return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 });
    }
}

// DELETE - Remove staff member
export async function DELETE(request: Request) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        await pool.query('DELETE FROM authentication WHERE user_id = $1', [userId]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing staff:', error);
        return NextResponse.json({ error: 'Failed to remove staff' }, { status: 500 });
    }
}
