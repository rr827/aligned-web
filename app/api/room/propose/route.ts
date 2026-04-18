import { NextRequest, NextResponse } from 'next/server';
import { proposeTime } from '@/lib/room';

export async function POST(req: NextRequest) {
  try {
    const { code, proposerIndex, startTime, endTime } = await req.json();
    if (!code || proposerIndex == null || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    await proposeTime(code, proposerIndex, startTime, endTime);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('propose time:', err);
    return NextResponse.json({ error: err.message ?? 'Failed to propose' }, { status: 500 });
  }
}
