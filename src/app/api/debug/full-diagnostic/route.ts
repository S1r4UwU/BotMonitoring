import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

interface Diagnostics {
  timestamp: string;
  environment: {
    demo_mode?: string;
    node_env?: string;
    app_url?: string;
  };
  database: {
    supabase_configured: boolean;
    supabase_url: boolean;
    connection_test?: string;
  };
  apis: Record<string, boolean>;
}

export async function GET() {
  const diagnostics: Diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      demo_mode: process.env.NEXT_PUBLIC_DEMO_MODE,
      node_env: process.env.NODE_ENV,
      app_url: process.env.NEXT_PUBLIC_APP_URL
    },
    database: {
      supabase_configured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('xldwlvoxfqrzebdzpxes') || false
    },
    apis: {
      reddit: !!(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET),
      youtube: !!process.env.YOUTUBE_API_KEY,
      news: !!process.env.NEWS_API_KEY,
      facebook: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      resend: !!process.env.RESEND_API_KEY,
      telegram: !!process.env.TELEGRAM_BOT_TOKEN,
      discord: !!process.env.DISCORD_BOT_TOKEN,
      mastodon: !!process.env.MASTODON_INSTANCE_URL
    }
  };

  try {
    const supabase = createAdminClient();
    const { count, error } = await supabase.from('cases').select('*', { count: 'exact', head: true });
    diagnostics.database.connection_test = error ? `Error: ${error.message}` : `Success: ${count || 0} cases found`;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'unknown';
    diagnostics.database.connection_test = `Exception: ${message}`;
  }

  return NextResponse.json(diagnostics);
}


