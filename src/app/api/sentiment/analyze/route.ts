/**
 * API Route - Analyse de sentiment
 * POST /api/sentiment/analyze
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { sentimentAnalysis } from '@/services/sentiment-analysis';

export async function POST(request: NextRequest) {
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

    const { text, isUrgent = false, forceAI = false } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text required for sentiment analysis' },
        { status: 400 }
      );
    }

    // Analyser le sentiment
    const result = await sentimentAnalysis.analyzeSentiment(text, isUrgent, forceAI);

    return NextResponse.json({
      sentiment: result,
      usageStats: sentimentAnalysis.getUsageStats(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur API analyse sentiment:', error);
    
    // En cas d'erreur IA, retourner un fallback lexicon
    try {
      const fallbackResult = {
        score: 0,
        confidence: 0.1,
        method: 'fallback',
        reasoning: 'Erreur IA - score neutre par défaut'
      };

      return NextResponse.json({
        sentiment: fallbackResult,
        error: error instanceof Error ? error.message : 'AI analysis failed',
        fallback: true
      });
    } catch {
      return NextResponse.json(
        { error: 'Sentiment analysis failed' },
        { status: 500 }
      );
    }
  }
}

export async function GET() {
  try {
    // Obtenir les statistiques d'usage IA
    const stats = sentimentAnalysis.getUsageStats();
    
    return NextResponse.json({
      usageStats: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur API stats sentiment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
