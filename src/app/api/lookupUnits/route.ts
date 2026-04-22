import { NextResponse } from 'next/server';
import { getIndustryData } from '@/lib/excelParser';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const industryName = searchParams.get('industry');

  if (!industryName) {
    return NextResponse.json({ error: 'Industry name is required' }, { status: 400 });
  }

  const data = getIndustryData(industryName);

  if (data) {
    return NextResponse.json({ success: true, data }, { status: 200 });
  } else {
    // If industry not found, return empty units so the frontend knows it didn't match.
    return NextResponse.json({ success: false, data: null }, { status: 200 });
  }
}
