import { NextRequest, NextResponse } from 'next/server';
import { joinRoom } from '@/lib/room';

export async function POST(req: NextRequest) {
  try {
    const { code, payload } = await req.json();
    if (!code || !payload) {
      return NextResponse.json({ error: 'Missing code or payload' }, { status: 400 });
    }
    const room = await joinRoom(code, payload);
    return NextResponse.json({ room });
  } catch (err: any) {
    console.error('join room:', err);
    return NextResponse.json({ error: err.message ?? 'Failed to join room' }, { status: 500 });
  }
}
