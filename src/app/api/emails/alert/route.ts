import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY manquante' }, { status: 400 });
    }

    const { mentionId, caseName, severity, platform, content, sentimentScore } = await request.json();

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'SocialGuard <noreply@socialguard.com>',
        to: ['test@example.com'],
        subject: `Alerte ${severity?.toUpperCase() || 'CRITIQUE'} - ${caseName}`,
        html: `
          <h2>🚨 Alerte SocialGuard (${severity || 'critical'})</h2>
          <p><strong>Cas:</strong> ${caseName}</p>
          <p><strong>Plateforme:</strong> ${platform}</p>
          <p><strong>Sentiment:</strong> ${sentimentScore}</p>
          <p><strong>Mention:</strong> ${content}</p>
          <p><small>Mention ID: ${mentionId}</small></p>
        `
      })
    });

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ error: txt }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ERROR] Envoi alerte:', error);
    return NextResponse.json({ error: 'Erreur alerte email' }, { status: 500 });
  }
}


