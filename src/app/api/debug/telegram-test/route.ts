import { NextResponse } from 'next/server';
import { telegramAPI } from '@/services/telegram-api';

export async function GET() {
  try {
    const res = await telegramAPI.testConnection();
    return NextResponse.json(res);
  } catch {
    return NextResponse.json({ success: false, message: 'Erreur test Telegram' }, { status: 500 });
  }
}


