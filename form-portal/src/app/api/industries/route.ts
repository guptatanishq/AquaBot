import { NextResponse } from 'next/server';
import { getAllIndustries } from '@/lib/excelParser';

export async function GET() {
  const data = getAllIndustries();
  return NextResponse.json({ success: true, data }, { status: 200 });
}
