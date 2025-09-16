'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClientComponentClient } from '@/lib/supabase-client';
import { DashboardMetrics } from '@/models/types';

interface UseDashboardStatsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseDashboardStatsReturn {
  stats: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
}

export function useDashboardStats({
  autoRefresh = true,
  refreshInterval = 180000, // 3 minutes
}: UseDashboardStatsOptions = {}): UseDashboardStatsReturn {
  const [stats, setStats] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClientComponentClient();
  const fetchStatsRef = useRef<typeof fetchStats>();

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[DEBUG] useDashboardStats fetchStats appelé');

      // Récupérer stats depuis l'API
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          console.log('[INFO] Dashboard stats récupérées depuis API:', result.data);
          setStats(result.data);
          return;
        }
      }

      // Fallback vers Supabase si localStorage échoue
      const [
        mentionsResult,
        newMentionsResult,
        sentimentResult,
        platformResult,
        responsesResult,
        casesResult,
        alertsResult
      ] = await Promise.all([
        // Total mentions
        supabase
          .from('mentions')
          .select('id', { count: 'exact', head: true }),
        
        // Nouvelles mentions (dernières 24h)
        supabase
          .from('mentions')
          .select('id', { count: 'exact', head: true })
          .gte('discovered_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        
        // Distribution du sentiment
        supabase
          .from('mentions')
          .select('sentiment_score')
          .not('sentiment_score', 'is', null),
        
        // Répartition par plateforme
        supabase
          .from('mentions')
          .select('platform', { count: 'exact' }),
        
        // Statistiques des réponses
        supabase
          .from('responses')
          .select('status, sent_at')
          .eq('status', 'sent'),
        
        // Cas actifs
        supabase
          .from('cases')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
        
        // Alertes critiques
        supabase
          .from('alerts')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'new')
          .in('severity', ['high', 'critical'])
      ]);

      // Traiter les résultats
      const totalMentions = mentionsResult.count || 0;
      const newMentions = newMentionsResult.count || 0;
      const activeCases = casesResult.count || 0;
      const criticalAlerts = alertsResult.count || 0;

      // Calculer la distribution du sentiment
      const sentimentData = sentimentResult.data || [];
      let positive = 0, negative = 0, neutral = 0;
      
      sentimentData.forEach(item => {
        if (item.sentiment_score > 1) positive++;
        else if (item.sentiment_score < -1) negative++;
        else neutral++;
      });

      // Calculer la répartition par plateforme
      const platformData = platformResult.data || [];
      const platformBreakdown = platformData.reduce((acc, item) => {
        acc[item.platform] = (acc[item.platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculer les métriques de réponse
      const responsesData = responsesResult.data || [];
      const responseCount = responsesData.length;
      const responseRate = totalMentions > 0 ? (responseCount / totalMentions) * 100 : 0;
      
      // Calculer le temps moyen de réponse (placeholder)
      const avgResponseTime = 0; // À implémenter plus tard

      const dashboardStats: DashboardMetrics = {
        total_mentions: totalMentions,
        new_mentions: newMentions,
        sentiment_distribution: {
          positive,
          negative,
          neutral,
        },
        platform_breakdown: platformBreakdown,
        response_rate: responseRate,
        avg_response_time: avgResponseTime,
        active_cases: activeCases,
        critical_alerts: criticalAlerts,
      };

      console.log('[INFO] Dashboard stats calculées:', dashboardStats);
      setStats(dashboardStats);

    } catch (err) {
      console.error('[ERROR] useDashboardStats fetchStats:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Mettre à jour la ref
  fetchStatsRef.current = fetchStats;

  const refreshStats = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  // Effect pour charger les stats initiales
  useEffect(() => {
    fetchStats();
  }, [fetchStats]); // Inclure fetchStats dans les dépendances

  // Effect pour l'auto-refresh
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      if (fetchStatsRef.current) {
        fetchStatsRef.current();
      }
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]); // Utiliser la ref pour éviter les boucles

  return {
    stats,
    loading,
    error,
    refreshStats,
  };
}
