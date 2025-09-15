/**
 * API Route - Test direct du service email Resend
 * POST /api/test-email
 */

import { NextRequest, NextResponse } from 'next/server';
import { emailAlerts } from '@/services/email-alerts';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email address required' },
        { status: 400 }
      );
    }

    // Valider le format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Envoyer l'email de test
    const result = await emailAlerts.testEmailService(email);

    return NextResponse.json({
      ...result,
      emailStats: emailAlerts.getEmailStats(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur API test email:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// Obtenir les statistiques d'usage email
export async function GET() {
  try {
    const stats = emailAlerts.getEmailStats();
    const isConfigured = emailAlerts.isConfigured();

    return NextResponse.json({
      configured: isConfigured,
      stats,
      limits: {
        monthly: 3000,
        remaining: stats.remainingEmails,
        resetDate: stats.resetDate
      },
      provider: 'Resend',
      features: [
        'Taux de délivrabilité > 99%',
        'Analytics détaillées',
        'Templates HTML responsive', 
        'Support des domaines personnalisés'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur API email stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
