import { NextRequest, NextResponse } from 'next/server';
import { createRoom } from '@/lib/room';

export async function POST(req: NextRequest) {
  try {
    const { payload } = await req.json();
    if (!payload || typeof payload !== 'string') {
      return NextResponse.json({ error: 'Missing payload' }, { status: 400 });
    }
    const code = await createRoom(payload);
    return NextResponse.json({ code });
  } catch (err) {
    console.error('create room:', err);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
