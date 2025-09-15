import { NextResponse } from 'next/server';

export async function POST() {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY manquante' }, { status: 400 });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'SocialGuard <noreply@socialguard.com>',
        to: ['test@example.com'],
        subject: 'Test SocialGuard - Alerte Monitoring',
        html: `
          <h2>🚨 Alerte SocialGuard</h2>
          <p>Nouvelle mention négative détectée !</p>
          <p><strong>Cas:</strong> Test Monitoring</p>
          <p><strong>Plateforme:</strong> Reddit</p>
          <p><strong>Sentiment:</strong> -4/5</p>
          <p><strong>Action recommandée:</strong> Réponse immédiate requise</p>
        `
      })
    });

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ error: txt }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Email test envoyé' });
  } catch (error) {
    console.error('[ERROR] Test email:', error);
    return NextResponse.json({ error: 'Erreur envoi email' }, { status: 500 });
  }
}


