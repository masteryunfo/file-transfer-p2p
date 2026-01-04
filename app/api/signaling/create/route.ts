import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function POST() {
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  await kv.set(`room:${roomId}`, {
    offer: null,
    answer: null,
    ice: []
  }, { ex: 300 });
  
  return NextResponse.json({ roomId });
}
