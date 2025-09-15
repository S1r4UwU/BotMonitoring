import { NextResponse } from 'next/server';
import { youtubeAPI } from '@/services/youtube-api';

export async function GET() {
  try {
    const res = await youtubeAPI.testConnection();
    return NextResponse.json(res);
  } catch (e) {
    return NextResponse.json({ success: false, message: 'Erreur test YouTube' }, { status: 500 });
  }
}


