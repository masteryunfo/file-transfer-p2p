import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  const { type, data } = await request.json();
  const { roomId } = params;
  
  const room: any = await kv.get(`room:${roomId}`) || { offer: null, answer: null, ice: [] };
  
  if (type === 'offer') room.offer = data;
  if (type === 'answer') room.answer = data;
  if (type === 'ice') room.ice.push(data);
  
  await kv.set(`room:${roomId}`, room, { ex: 300 });
  
  return NextResponse.json({ ok: true });
}
