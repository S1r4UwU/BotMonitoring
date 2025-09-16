import { NextResponse } from 'next/server';
import { mastodonAPI } from '@/services/mastodon-api';

export async function GET() {
  try {
    const res = await mastodonAPI.testConnection();
    return NextResponse.json(res);
  } catch {
    return NextResponse.json({ success: false, message: 'Erreur test Mastodon' }, { status: 500 });
  }
}


