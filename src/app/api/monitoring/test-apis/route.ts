/**
 * API Route - Test des connexions APIs externes
 * GET /api/monitoring/test-apis
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { facebookAPI } from '@/services/facebook-api';
import { redditAPI } from '@/services/reddit-api';
import { emailAlerts } from '@/services/email-alerts';

export async function GET(request: NextRequest) {
  try {
    // Authentification requise sauf en mode démo
    if (!process.env.NEXT_PUBLIC_DEMO_MODE) {
      const supabase = createRouteHandlerClient(request);
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (!user || authError) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    // Tester toutes les APIs en parallèle
    const [facebookTest, redditTest, emailTest] = await Promise.allSettled([
      facebookAPI.testConnection(),
      redditAPI.testConnection(),
      emailAlerts.testEmailService('test@example.com') // test fictif
    ]);

    const results = {
      facebook: facebookTest.status === 'fulfilled' ? facebookTest.value : { 
        success: false, 
        message: facebookTest.reason?.message || 'Test failed' 
      },
      reddit: redditTest.status === 'fulfilled' ? redditTest.value : { 
        success: false, 
        message: redditTest.reason?.message || 'Test failed' 
      },
      email: emailTest.status === 'fulfilled' ? emailTest.value : { 
        success: false, 
        message: emailTest.reason?.message || 'Test failed' 
      },
      rateLimit: {
        facebook: facebookAPI.getRateLimitInfo(),
        reddit: redditAPI.getRateLimitInfo()
      },
      emailStats: emailAlerts.getEmailStats(),
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(results);

  } catch (error) {
    console.error('Erreur test APIs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Test avec email réel (pour les utilisateurs authentifiés)
    if (!process.env.NEXT_PUBLIC_DEMO_MODE) {
      const supabase = createRouteHandlerClient(request);
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (!user || authError) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      const { testEmail } = await request.json();

      if (!testEmail) {
        return NextResponse.json(
          { error: 'Test email required' },
          { status: 400 }
        );
      }

      // Envoyer un email de test réel
      const emailResult = await emailAlerts.testEmailService(testEmail);

      return NextResponse.json({
        email: emailResult,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        email: { success: true, message: 'Mode démo : email de test simulé' },
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Erreur test email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
