'use client';

import { useState, useEffect, useCallback } from 'react';
import { DemoDataService } from '@/services/demo-data';
import { DashboardMetrics } from '@/models/types';

interface UseDemoDashboardStatsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseDemoDashboardStatsReturn {
  stats: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
}

export function useDemoDashboardStats({
  autoRefresh = true,
  refreshInterval = 60000, // 1 minute
}: UseDemoDashboardStatsOptions = {}): UseDemoDashboardStatsReturn {
  const [stats, setStats] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Simuler un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 300));

      const dashboardStats = await DemoDataService.getMetrics();
      setStats(dashboardStats);

    } catch (err) {
      console.error('Erreur lors de la récupération des statistiques de démo:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  // Effect pour charger les stats initiales
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Effect pour l'auto-refresh
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;

    const interval = setInterval(refreshStats, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshStats]);

  return {
    stats,
    loading,
    error,
    refreshStats,
  };
}
