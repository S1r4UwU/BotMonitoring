'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Zap,
  Mail,
  AlertTriangle
} from 'lucide-react';

interface APIStatus {
  facebook: { success: boolean; message: string };
  reddit: { success: boolean; message: string };
  email: { success: boolean; message: string };
  rateLimit: {
    facebook: { remaining: number; resetTime: Date; isLimited: boolean };
    reddit: { remaining: number; resetTime: Date; isLimited: boolean };
  };
  emailStats: {
    monthlyCount: number;
    maxEmails: number;
    usagePercent: number;
    remainingEmails: number;
    canSend: boolean;
  };
}

export function APIStatus() {
  const [status, setStatus] = useState<APIStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/monitoring/test-apis');
      
      if (!response.ok) {
        throw new Error('Failed to fetch API status');
      }

      const data = await response.json();
      setStatus(data);

    } catch (err) {
      console.error('Erreur récupération status APIs:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Refresh automatique toutes les 2 minutes
    const interval = setInterval(fetchStatus, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Connecté
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        Erreur
      </Badge>
    );
  };

  const getRateLimitBadge = (limit: { remaining: number; isLimited: boolean }) => {
    if (limit.isLimited) {
      return <Badge variant="destructive">Quota épuisé</Badge>;
    } else if (limit.remaining < 10) {
      return <Badge className="bg-yellow-100 text-yellow-800">Quota bas ({limit.remaining})</Badge>;
    } else {
      return <Badge variant="secondary">{limit.remaining} req disponibles</Badge>;
    }
  };

  if (loading && !status) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-5 bg-gray-300 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/6"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-blue-600" />
            État des APIs
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStatus}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {status && (
          <>
            {/* Status des connexions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">📘</span>
                  <span className="font-medium">Facebook</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(status.facebook.success)}
                  {status.rateLimit?.facebook && getRateLimitBadge(status.rateLimit.facebook)}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🤖</span>
                  <span className="font-medium">Reddit</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(status.reddit.success)}
                  {status.rateLimit?.reddit && getRateLimitBadge(status.rateLimit.reddit)}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Email</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(status.email.success)}
                  {status.emailStats && (
                    <Badge variant="secondary">
                      {status.emailStats.remainingEmails} emails restants
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Quotas et usage */}
            {status.emailStats && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Quotas mensuels</h4>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Emails envoyés</span>
                      <span>{status.emailStats.monthlyCount} / {status.emailStats.maxEmails}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          status.emailStats.usagePercent > 80 
                            ? 'bg-red-500' 
                            : status.emailStats.usagePercent > 60 
                            ? 'bg-yellow-500' 
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(status.emailStats.usagePercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Messages d'erreur détaillés */}
            {(!status.facebook.success || !status.reddit.success || !status.email.success) && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Détails des erreurs</h4>
                <div className="space-y-1 text-xs">
                  {!status.facebook.success && (
                    <p className="text-red-600">📘 Facebook: {status.facebook.message}</p>
                  )}
                  {!status.reddit.success && (
                    <p className="text-red-600">🤖 Reddit: {status.reddit.message}</p>
                  )}
                  {!status.email.success && (
                    <p className="text-red-600">📧 Email: {status.email.message}</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
