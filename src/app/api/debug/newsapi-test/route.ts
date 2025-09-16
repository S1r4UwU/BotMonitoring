import { NextResponse } from 'next/server';
import { newsAPI } from '@/services/news-api';

export async function GET() {
  try {
    const res = await newsAPI.testConnection();
    return NextResponse.json(res);
  } catch {
    return NextResponse.json({ success: false, message: 'Erreur test NewsAPI' }, { status: 500 });
  }
}


