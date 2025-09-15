import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasRedditClientId: !!process.env.REDDIT_CLIENT_ID,
    hasRedditSecret: !!process.env.REDDIT_CLIENT_SECRET,
    hasUserAgent: !!process.env.REDDIT_USER_AGENT,
    redditClientIdLength: process.env.REDDIT_CLIENT_ID?.length || 0,
    redditSecretLength: process.env.REDDIT_CLIENT_SECRET?.length || 0,
    userAgent: process.env.REDDIT_USER_AGENT || 'Non défini'
  });
}


