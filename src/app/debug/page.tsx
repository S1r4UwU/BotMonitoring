'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bug,
  Database,
  Key,
  Wifi,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

interface DebugInfo {
  environment: Record<string, string>;
  database: {
    connection: boolean;
    tablesCount: Record<string, number>;
    error?: string;
  };
  apis: Record<string, unknown>;
  system: {
    timestamp: string;
    version: string;
  };
}

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDebugInfo = async () => {
    try {
      setLoading(true);
      
      const [casesRes, apisRes] = await Promise.allSettled([
        fetch('/api/cases'),
        fetch('/api/monitoring/test-apis')
      ]);

      const environment = {
        'NEXT_PUBLIC_DEMO_MODE': process.env.NEXT_PUBLIC_DEMO_MODE || 'undefined',
        'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configuré' : '❌ Non configuré',
        'NODE_ENV': process.env.NODE_ENV || 'undefined',
        'User Agent': navigator.userAgent.split(' ')[0]
      };

      const database = {
        connection: casesRes.status === 'fulfilled' && casesRes.value.ok,
        tablesCount: casesRes.status === 'fulfilled' && casesRes.value.ok ? 
          await casesRes.value.json().then(data => ({ cases: data.count })) : 
          { error: 'Connexion échouée' },
        error: casesRes.status === 'rejected' ? casesRes.reason?.message : undefined
      };

      const apis = apisRes.status === 'fulfilled' && apisRes.value.ok ?
        await apisRes.value.json() :
        { error: 'APIs non disponibles' };

      const debugData: DebugInfo = {
        environment,
        database,
        apis: apis as Record<string, unknown>,
        system: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      setDebugInfo(debugData);

    } catch (error) {
      console.error('Erreur debug:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  const testCreateCase = async () => {
    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Debug Case',
          keywords: ['test', 'debug'],
          platforms: ['reddit'],
          description: 'Cas de test créé depuis la page de debug'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('✅ Test création cas : SUCCÈS !');
        fetchDebugInfo(); // Refresh
      } else {
        alert('❌ Test création cas : ÉCHEC - ' + result.error);
      }
    } catch (error) {
      alert('❌ Erreur test création : ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Debug SocialGuard</h1>
        <Card className="animate-pulse">
          <CardContent className="py-8">
            <div className="text-center">Chargement des informations de debug...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Debug SocialGuard</h1>
          <p className="text-gray-600">Informations système et diagnostic</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={fetchDebugInfo}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={testCreateCase}>
            <Bug className="h-4 w-4 mr-2" />
            Test Création Cas
          </Button>
        </div>
      </div>

      {debugInfo && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Variables d'environnement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2" />
                Variables d&apos;Environnement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(debugInfo.environment).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="font-mono">{key}:</span>
                    <span className={value.includes('✅') ? 'text-green-600' : value.includes('❌') ? 'text-red-600' : ''}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Base de données */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Base de Données
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  {debugInfo.database.connection ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>
                    {debugInfo.database.connection ? 'Connecté à Supabase' : 'Connexion échouée'}
                  </span>
                </div>

                {debugInfo.database.tablesCount && (
                  <div className="text-sm space-y-1">
                    {Object.entries(debugInfo.database.tablesCount).map(([table, count]) => (
                      <div key={table} className="flex justify-between">
                        <span className="capitalize">{table}:</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                )}

                {debugInfo.database.error && (
                  <Alert variant="destructive">
                    <AlertDescription className="text-sm">
                      {debugInfo.database.error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status APIs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wifi className="h-5 w-5 mr-2" />
                Status APIs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {debugInfo.apis.error ? (
                <Alert variant="destructive">
                  <AlertDescription>{debugInfo.apis.error}</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {Object.entries(debugInfo.apis).filter(([key]) => ['facebook', 'reddit', 'email'].includes(key)).map(([api, status]) => (
                    <div key={api} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="capitalize font-medium">{api}</span>
                      </div>
                      <Badge variant={(status as { success?: boolean })?.success ? 'default' : 'destructive'}>
                        {(status as { success?: boolean })?.success ? 'OK' : 'Erreur'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informations système */}
          <Card>
            <CardHeader>
              <CardTitle>Système</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Version:</span>
                  <Badge variant="outline">{debugInfo.system.version}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Timestamp:</span>
                  <span className="font-mono text-xs">
                    {new Date(debugInfo.system.timestamp).toLocaleString('fr-FR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Mode:</span>
                  <Badge>Production</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tests rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Tests Fonctionnels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" onClick={testCreateCase} className="justify-start">
              <Database className="h-4 w-4 mr-2" />
              Test Création Cas
            </Button>
            
            <Button variant="outline" onClick={() => window.location.href = '/api/monitoring/test-apis'} className="justify-start">
              <Wifi className="h-4 w-4 mr-2" />
              Test APIs
            </Button>
            
            <Button variant="outline" onClick={() => window.location.href = '/api/sentiment/analyze'} className="justify-start">
              <Bug className="h-4 w-4 mr-2" />
              Test IA
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Console logs */}
      <Card>
        <CardHeader>
          <CardTitle>Console & Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Ouvrez la console du navigateur (F12)</strong> pour voir les logs détaillés 
              de débogage et identifier les problèmes.
            </AlertDescription>
          </Alert>
          
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Types de logs disponibles :</strong></p>
            <ul className="mt-2 space-y-1 ml-4">
              <li>• [DEBUG] - Informations de débogage</li>
              <li>• [INFO] - Opérations réussies</li>
              <li>• [ERROR] - Erreurs détaillées</li>
              <li>• [WARN] - Avertissements</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
