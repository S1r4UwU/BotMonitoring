import { NextResponse } from 'next/server';
import { discordAPI } from '@/services/discord-api';

export async function GET() {
  try {
    const res = await discordAPI.testConnection();
    return NextResponse.json(res);
  } catch (e) {
    return NextResponse.json({ success: false, message: 'Erreur test Discord' }, { status: 500 });
  }
}


