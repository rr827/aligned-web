import { NextRequest, NextResponse } from 'next/server';
import { getRoom } from '@/lib/room';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const room = await getRoom(code);
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    return NextResponse.json(room);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Failed to get room' }, { status: 500 });
  }
}
