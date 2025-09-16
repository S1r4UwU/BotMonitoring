'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play,
  Pause,
  RotateCcw,
  Loader2,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface ScanResult {
  success: boolean;
  mentionsFound: number;
  error?: string;
  timestamp: string;
}

interface MonitoringStats {
  totalMentions: number;
  newMentions: number;
  errorsCount: number;
  lastRun: Date;
  nextRun: Date;
}

export function RealTimeScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [autoScan, setAutoScan] = useState(false);
  const [error, setError] = useState('');

  const fetchStatsRef = useRef<typeof fetchStats>();

  // Fetch des statistiques de monitoring
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/monitoring/scan');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Erreur récupération stats monitoring:', err);
    }
  }, []);

  // Mettre à jour la ref
  fetchStatsRef.current = fetchStats;

  const handleManualScan = useCallback(async () => {
    setIsScanning(true);
    setError('');

    try {
      const response = await fetch('/api/monitoring/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          caseId: 'demo-case-1'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setLastScan(result);
      await fetchStats();

    } catch (err) {
      console.error('Erreur scan manuel:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsScanning(false);
    }
  }, [fetchStats]);

  // Auto-scan toutes les 5 minutes si activé
  useEffect(() => {
    if (!autoScan) return;

    const interval = setInterval(() => {
      if (!isScanning) {
        handleManualScan();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoScan, isScanning, handleManualScan]);

  useEffect(() => {
    fetchStats();
    
    // Refresh stats toutes les 30 secondes
    const interval = setInterval(() => {
      if (fetchStatsRef.current) {
        fetchStatsRef.current();
      }
    }, 120 * 1000); // 2 minutes
    return () => clearInterval(interval);
  }, [fetchStats]); // Inclure fetchStats dans les dépendances

  const toggleAutoScan = () => {
    setAutoScan((prev) => !prev);
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Search className="h-5 w-5 mr-2 text-blue-600" />
          Scanner temps réel
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Contrôles de scan */}
        <div className="flex space-x-2">
          <Button
            onClick={handleManualScan}
            disabled={isScanning}
            className="flex-1"
          >
            {isScanning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scan en cours...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Scan manuel
              </>
            )}
          </Button>

          <Button
            onClick={toggleAutoScan}
            variant={autoScan ? 'default' : 'outline'}
            size="sm"
          >
            {autoScan ? (
              <Pause className="h-4 w-4" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Status auto-scan */}
        {autoScan && (
          <Alert className="border-blue-200 bg-blue-50">
            <Clock className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Auto-scan activé</strong> - Prochaine analyse dans ~5 minutes
            </AlertDescription>
          </Alert>
        )}

        {/* Résultat du dernier scan */}
        {lastScan && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Dernier scan</h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {lastScan.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm">
                  {lastScan.success 
                    ? `${lastScan.mentionsFound} mentions trouvées`
                    : `Erreur: ${lastScan.error}`
                  }
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {formatTime(lastScan.timestamp)}
              </span>
            </div>
          </div>
        )}

        {/* Statistiques de monitoring */}
        {stats && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Statistiques</h4>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalMentions}
                </div>
                <div className="text-xs text-gray-600">Total mentions</div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.newMentions}
                </div>
                <div className="text-xs text-gray-600">Nouvelles</div>
              </div>
            </div>

            {stats.errorsCount > 0 && (
              <div className="flex items-center space-x-2 text-sm text-orange-600">
                {/* @ts-expect-error lucide-react export already imported above; using AlertTriangle from lucide-react */}
                <AlertTriangle className="h-4 w-4" />
                <span>{stats.errorsCount} erreurs depuis le dernier redémarrage</span>
              </div>
            )}
          </div>
        )}

        {/* Mode démo info */}
        {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertDescription className="text-orange-800 text-xs">
              <strong>Mode démo:</strong> Les scans utilisent des données simulées. 
              Configurez les APIs pour des données réelles.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
