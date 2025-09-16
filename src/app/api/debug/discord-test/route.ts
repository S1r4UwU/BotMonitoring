import { NextResponse } from 'next/server';
import { discordAPI } from '@/services/discord-api';

export async function GET() {
  try {
    const res = await discordAPI.testConnection();
    return NextResponse.json(res);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Erreur test Discord';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}


