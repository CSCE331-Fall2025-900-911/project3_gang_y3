import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: Request) {
  try {
    const { email, role } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // If role is specified, check if user has that specific role
    if (role) {
      const result = await pool.query(
        'SELECT user_id, username, role, email FROM authentication WHERE email = $1 AND role = $2',
        [email, role]
      );

      if (result.rows.length === 0) {
        // Check if email exists with any role
        const anyRole = await pool.query(
          'SELECT role FROM authentication WHERE email = $1',
          [email]
        );
        
        if (anyRole.rows.length === 0) {
          return NextResponse.json({ 
            authorized: false, 
            error: 'Email not found in system. Please contact an administrator.' 
          }, { status: 401 });
        }
        
        const roles = anyRole.rows.map(r => r.role).join(', ');
        return NextResponse.json({ 
          authorized: false, 
          error: `You are registered as ${roles}, not ${role}.`,
          actualRoles: anyRole.rows.map(r => r.role)
        }, { status: 403 });
      }

      const user = result.rows[0];
      return NextResponse.json({ 
        authorized: true, 
        role: user.role,
        username: user.username
      });
    }

    // No role specified - just check if email exists
    const result = await pool.query(
      'SELECT user_id, username, role, email FROM authentication WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        authorized: false, 
        error: 'Email not found in system. Please contact an administrator.' 
      }, { status: 401 });
    }

    return NextResponse.json({ 
      authorized: true, 
      roles: result.rows.map(r => r.role),
      username: result.rows[0].username
    });

  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
