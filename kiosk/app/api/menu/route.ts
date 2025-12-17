
import { NextResponse } from 'next/server';
import { getMenuItems } from '../../../lib/db'; // Adjust path if needed: ../../../lib/db

export async function GET() {
    try {
        const items = await getMenuItems();
        return NextResponse.json({ items });
    } catch (error) {
        console.error('Failed to fetch menu:', error);
        return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 });
    }
}
