import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || 'test';
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  try {
    const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': process.env.REDDIT_USER_AGENT || 'SocialGuard/1.0'
      },
      body: 'grant_type=client_credentials'
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      return NextResponse.json({ success: false, step: 'authentication', error: 'Pas de token', tokenData }, { status: 401 });
    }

    const searchUrl = `https://oauth.reddit.com/search?q=${encodeURIComponent(query)}&sort=new&limit=${limit}&type=link`;
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'User-Agent': process.env.REDDIT_USER_AGENT || 'SocialGuard/1.0'
      }
    });

    const searchData = await searchResponse.json();
    type RedditChild = { data: { id: string; title: string; subreddit: string; author: string; score: number; num_comments: number; url: string; selftext?: string } };
    const posts: RedditChild[] = (searchData?.data?.children || []) as RedditChild[];
    const parsed = posts.map((c) => ({
      id: c.data.id,
      title: c.data.title,
      subreddit: c.data.subreddit,
      author: c.data.author,
      score: c.data.score,
      num_comments: c.data.num_comments,
      url: c.data.url,
      selftext: c.data.selftext?.substring(0, 120) || ''
    }));

    return NextResponse.json({
      success: searchResponse.ok,
      query,
      searchUrl,
      status: searchResponse.status,
      totalResults: posts.length,
      results: parsed,
      structure: {
        hasData: !!searchData.data,
        hasChildren: !!searchData.data?.children,
        childrenCount: posts.length
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown';
    return NextResponse.json({ success: false, error: message, query }, { status: 500 });
  }
}


