import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(request: NextRequest) {
  try {
    const { username, password, role } = await request.json();

    if (!username || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Query the authentication table
    const result = await pool.query(
      'SELECT user_id, username, role FROM authentication WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Check if the role matches
    if (user.role !== role) {
      return NextResponse.json(
        { error: `This account is not authorized for ${role} access` },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      username: user.username,
      role: user.role,
      userId: user.user_id,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
