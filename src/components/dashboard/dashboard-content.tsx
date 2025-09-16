'use client';

import { useEffect, useState } from 'react';
import { StatsCards, PlatformStats, ResponseStats } from './stats-cards';
import { MentionsTable } from './mentions-table';
import { APIStatus } from '@/components/monitoring/api-status';
import { RealTimeScanner } from '@/components/monitoring/real-time-scanner';
import { BudgetMonitor } from '@/components/monitoring/budget-monitor';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

export function DashboardContent() {
  // Données principales (requête initiale) - autoRefresh désactivé pour éviter les boucles
  const { stats, loading, error, refreshStats } = useDashboardStats({ autoRefresh: false });
  // Temps réel
  interface LiveStats {
    ts?: number;
    newCriticalMentions?: number;
    newPositiveMentions?: number;
    timeline?: unknown[];
    sentiments?: Record<string, unknown>;
    platforms?: Record<string, unknown>;
  }
  const [, setRealTimeStats] = useState<LiveStats | null>(null);
  const [isLive, setIsLive] = useState(false);
  const { toast } = useToast();

  // Connexion temps réel via SSE
  useEffect(() => {
    const es = new EventSource('/api/dashboard/live');
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setRealTimeStats(data);
        setIsLive(true);

        if (data.newCriticalMentions > 0) {
          toast({
            title: '🚨 Alertes critiques',
            description: `${data.newCriticalMentions} nouvelles mentions critiques détectées`,
            variant: 'destructive',
          });
        }

        if (data.newPositiveMentions > 5) {
          toast({
            title: '📈 Pic positif',
            description: `${data.newPositiveMentions} mentions positives détectées`,
            variant: 'success',
          });
        }
      } catch {}
    };
    es.onerror = () => setIsLive(false);
    return () => es.close();
  }, [toast]);

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Erreur lors du chargement des statistiques: {error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshStats}
              className="ml-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
        
        {/* Afficher quand même le tableau des mentions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <MentionsTable maxItems={10} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard SocialGuard</h1>
          <p className="text-muted-foreground">Vue d&apos;ensemble de votre monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-sm">{isLive ? 'Temps réel' : 'Hors ligne'}</span>
        </div>
      </div>
      {/* Cartes de statistiques principales */}
      {stats && (
        <StatsCards stats={stats} loading={loading} />
      )}

      {/* Grille principale avec mentions et panneaux de monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tableau des mentions (2/3 de la largeur) */}
        <div className="lg:col-span-2">
          <MentionsTable maxItems={10} autoRefresh={false} />
        </div>

        {/* Panneaux de monitoring (1/3 de la largeur) */}
        <div className="space-y-6">
          {/* Scanner temps réel */}
          <RealTimeScanner />

          {/* Répartition par plateforme */}
          {stats && (
            <PlatformStats 
              platformData={stats.platform_breakdown} 
              loading={loading} 
            />
          )}

          {/* Budget IA */}
          <BudgetMonitor />
        </div>
      </div>

      {/* Grille secondaire pour les outils de monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status des APIs */}
        <APIStatus />

        {/* Statistiques de réponse */}
        {stats && (
          <ResponseStats
            responseRate={stats.response_rate}
            avgResponseTime={stats.avg_response_time}
            loading={loading}
          />
        )}
      </div>

      {/* Section d'actions rapides */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Actions rapides
            </h3>
            <p className="text-gray-600 mt-1">
              Configurez votre monitoring en quelques clics
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              Nouveau cas
            </Button>
            <Button>
              Configurer APIs
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
