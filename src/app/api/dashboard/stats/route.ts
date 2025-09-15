/**
 * API Route - Statistiques Dashboard en temps réel
 * GET /api/dashboard/stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { DemoDataService, isDemoMode } from '@/services/demo-data';
import { sentimentAnalysis } from '@/services/sentiment-analysis';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const caseIdsParam = searchParams.get('caseIds');
    const caseIds = caseIdsParam ? caseIdsParam.split(',').map(x => x.trim()).filter(Boolean) : [];

    const [
      mentionsResult,
      newMentionsResult,
      sentimentResult,
      platformResult,
      responsesResult,
      casesResult,
      alertsResult
    ] = await Promise.allSettled([
      // Total mentions
      (caseIds.length
        ? supabase.from('mentions').select('id', { count: 'exact', head: true }).in('case_id', caseIds)
        : supabase.from('mentions').select('id', { count: 'exact', head: true })
      ),
      
      // Nouvelles mentions (dernières 24h)
      (caseIds.length
        ? supabase.from('mentions').select('id', { count: 'exact', head: true }).in('case_id', caseIds).gte('discovered_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        : supabase.from('mentions').select('id', { count: 'exact', head: true }).gte('discovered_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ),
      
      // Distribution du sentiment
      (caseIds.length
        ? supabase.from('mentions').select('sentiment_score,case_id').in('case_id', caseIds).not('sentiment_score', 'is', null)
        : supabase.from('mentions').select('sentiment_score').not('sentiment_score', 'is', null)
      ),
      
      // Répartition par plateforme
      (caseIds.length
        ? supabase.from('mentions').select('platform,case_id').in('case_id', caseIds)
        : supabase.from('mentions').select('platform')
      ),
      
      // Statistiques des réponses (optionnel si table absente)
      supabase.from('responses').select('status').eq('status', 'sent'),
      
      // Cas actifs
      supabase.from('cases').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      
      // Alertes critiques (optionnel si table absente)
      supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('status', 'new').in('severity', ['high', 'critical'])
    ]);

    // Traiter les résultats
    const totalMentions = mentionsResult.status === 'fulfilled' ? (mentionsResult.value.count || 0) : 0;
    const newMentions = newMentionsResult.status === 'fulfilled' ? (newMentionsResult.value.count || 0) : 0;
    const activeCases = casesResult.status === 'fulfilled' ? (casesResult.value.count || 0) : 0;
    const criticalAlerts = alertsResult.status === 'fulfilled' ? (alertsResult.value.count || 0) : 0;

    // Calculer la distribution du sentiment
    const sentimentData = sentimentResult.status === 'fulfilled' ? (sentimentResult.value.data || []) : [];
    let positive = 0, negative = 0, neutral = 0;
    
    sentimentData.forEach(item => {
      if (item.sentiment_score > 1) positive++;
      else if (item.sentiment_score < -1) negative++;
      else neutral++;
    });

    // Calculer la répartition par plateforme
    const platformData = platformResult.status === 'fulfilled' ? (platformResult.value.data || []) : [];
    const platformBreakdown = platformData.reduce((acc, item) => {
      acc[item.platform] = (acc[item.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculer les métriques de réponse
    const responsesData = responsesResult.status === 'fulfilled' ? (responsesResult.value.data || []) : [];
    const responseCount = responsesData.length;
    const responseRate = totalMentions > 0 ? (responseCount / totalMentions) * 100 : 0;

    const dashboardStats = {
      total_mentions: totalMentions,
      new_mentions: newMentions,
      sentiment_distribution: {
        positive,
        negative,
        neutral,
      },
      platform_breakdown: platformBreakdown,
      response_rate: responseRate,
      avg_response_time: 0, // À calculer plus tard
      active_cases: activeCases,
      critical_alerts: criticalAlerts,
    };

    // Ajouter les stats d'usage IA
    const aiUsageStatsProd = sentimentAnalysis.getUsageStats();

    return NextResponse.json({
      success: true,
      data: {
        ...dashboardStats,
        aiUsage: aiUsageStatsProd,
        mode: 'production'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur API stats dashboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
