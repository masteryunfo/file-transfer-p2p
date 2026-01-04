import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  const { roomId } = params;
  const room = await kv.get(`room:${roomId}`);
  
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }
  
  return NextResponse.json(room);
}
