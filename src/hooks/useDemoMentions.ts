'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DemoDataService } from '@/services/demo-data';
import { Mention, MentionFilters } from '@/models/types';

interface UseDemoMentionsOptions {
  filters?: MentionFilters;
  pageSize?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseDemoMentionsReturn {
  mentions: Mention[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  fetchMentions: (page?: number) => Promise<void>;
  refreshMentions: () => Promise<void>;
  updateMentionStatus: (id: string, status: Mention['status']) => Promise<void>;
}

export function useDemoMentions({
  filters = {},
  pageSize = 20,
  autoRefresh = false,
  refreshInterval = 30000,
}: UseDemoMentionsOptions = {}): UseDemoMentionsReturn {
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const fetchMentionsRef = useRef<(page?: number) => Promise<void>>();
  
  // Calculer les pages
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const fetchMentions = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      // Simuler un délai de chargement pour l'effet de réalisme
      await new Promise(resolve => setTimeout(resolve, 500));

      const { data, count } = await DemoDataService.getMentions(filters, page, pageSize);

      setMentions(data);
      setTotalCount(count);
      setCurrentPage(page);

    } catch (err) {
      console.error('Erreur lors de la récupération des mentions de démo:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [filters, pageSize]);

  // Garder une ref stable vers la fonction pour l'intervalle
  useEffect(() => {
    fetchMentionsRef.current = fetchMentions;
  }, [fetchMentions]);

  const refreshMentions = useCallback(async () => {
    await fetchMentions(currentPage);
  }, [currentPage, fetchMentions]);

  const updateMentionStatus = async (id: string, status: Mention['status']) => {
    try {
      // Simuler la mise à jour
      setMentions(prev => 
        prev.map(mention => 
          mention.id === id ? { ...mention, status } : mention
        )
      );

      // En mode démo, juste simuler le succès
      console.log(`Status updated for mention ${id}: ${status}`);

    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      throw err;
    }
  };

  // Effect pour charger les mentions initiales
  useEffect(() => {
    fetchMentions(1);
  }, [fetchMentions]);

  // Effect pour l'auto-refresh
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      fetchMentionsRef.current?.(currentPage);
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, currentPage]);

  return {
    mentions,
    loading,
    error,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    fetchMentions,
    refreshMentions,
    updateMentionStatus,
  };
}
