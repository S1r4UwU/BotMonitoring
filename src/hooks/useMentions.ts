'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClientComponentClient } from '@/lib/supabase-client';
import { Mention, MentionFilters } from '@/models/types';

interface UseMentionsOptions {
  filters?: MentionFilters;
  pageSize?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseMentionsReturn {
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

export function useMentions({
  pageSize = 20,
  autoRefresh = false,
  refreshInterval = 120000, // 2 minutes
}: UseMentionsOptions = {}): UseMentionsReturn {
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

      console.log('[DEBUG] useMentions fetchMentions appelé, page:', page);

      // Récupérer depuis l'API
      const response = await fetch(`/api/mentions?page=${page}&limit=${pageSize}`);
      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          console.log(`[INFO] ${result.data.length} mentions récupérées depuis API (total: ${result.count})`);
          
          setMentions(result.data);
          setTotalCount(result.count);
          setCurrentPage(page);
          return;
        }
      }

      throw new Error('Erreur API mentions');

    } catch (err) {
      console.error('[ERROR] Erreur lors de la récupération des mentions:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  // Mettre à jour la ref quand la fonction change
  useEffect(() => {
    fetchMentionsRef.current = fetchMentions;
  }, [fetchMentions]);

  const refreshMentions = useCallback(async () => {
    await fetchMentions(currentPage);
  }, [currentPage, fetchMentions]);

  const updateMentionStatus = async (id: string, status: Mention['status']) => {
    try {
      console.log(`[DEBUG] Mise à jour statut mention ${id} vers ${status}`);
      
      // Utiliser l'API pour mettre à jour
      const response = await fetch('/api/mentions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });

      if (response.ok) {
        // Mettre à jour l'état local
        setMentions(prev => 
          prev.map(mention => 
            mention.id === id ? { ...mention, status } : mention
          )
        );
        
        console.log(`[INFO] Statut mention ${id} mis à jour vers ${status}`);
        return;
      } else {
        throw new Error('Erreur API update mention');
      }

      // Si l'API échoue, fallback vers Supabase (client créé localement)
      try {
        const supabase = createClientComponentClient();
        const { error: updateError } = await supabase
          .from('mentions')
          .update({ status })
          .eq('id', id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        setMentions(prev => 
          prev.map(mention => 
            mention.id === id ? { ...mention, status } : mention
          )
        );
      } catch (fallbackErr) {
        console.error('[ERROR] Fallback Supabase update failed:', fallbackErr);
      }

    } catch (err) {
      console.error('[ERROR] Erreur lors de la mise à jour du statut:', err);
      throw err;
    }
  };

  // Effect pour charger les mentions initiales
  useEffect(() => {
    fetchMentions(1);
  }, [fetchMentions]); // Inclure fetchMentions dans les dépendances

  // Effect pour l'auto-refresh
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      if (fetchMentionsRef.current) {
        fetchMentionsRef.current(currentPage);
      }
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, currentPage]); // Utiliser la ref pour éviter les boucles

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
