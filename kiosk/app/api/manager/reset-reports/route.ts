import { NextResponse } from 'next/server';
import { resetReports } from '@/lib/managerData';

export async function POST() {
  await resetReports();
  return NextResponse.json({ success: true });
}
