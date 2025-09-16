import { NextResponse } from 'next/server';
import { hackerNewsAPI } from '@/services/hackernews-api';

export async function GET() {
  try {
    const res = await hackerNewsAPI.testConnection();
    return NextResponse.json(res);
  } catch {
    return NextResponse.json({ success: false, message: 'Erreur test HackerNews' }, { status: 500 });
  }
}


