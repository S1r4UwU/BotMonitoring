import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const authResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': process.env.REDDIT_USER_AGENT || 'SocialGuard/1.0'
      },
      body: 'grant_type=client_credentials'
    });

    const authData = await authResponse.json();

    return NextResponse.json({
      success: authResponse.ok,
      status: authResponse.status,
      hasAccessToken: !!authData.access_token,
      tokenType: authData.token_type,
      expiresIn: authData.expires_in,
      error: authData.error || null,
      fullResponse: authData
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'unknown' }, { status: 500 });
  }
}


